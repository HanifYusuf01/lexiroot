import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppStoreServerAPIClient,
  AutoRenewStatus,
  Environment,
  NotificationTypeV2,
  SignedDataVerifier,
  Status,
  type ResponseBodyV2DecodedPayload,
} from '@apple/app-store-server-library';
import type { ProviderKey, SubscriptionStatus } from '@lexiroot/shared';
import type { PaymentsConfig } from '../../../config/payments.config';
import type {
  CheckoutOutcome,
  CheckoutResult,
  CreateCheckoutInput,
  NormalizedEvent,
  NormalizedEventKind,
  PaymentProvider,
  ProviderInvoiceSnapshot,
  ProviderSubSnapshot,
  SyncPlanPriceInput,
  SyncPlanPriceResult,
} from './payment-provider.interface';

let cachedRootCertificates: Buffer[] | null = null;

/**
 * Apple's DER-encoded PKI root certificates, downloaded once from
 * https://www.apple.com/certificateauthority/ and checked into the repo — they
 * anchor the certificate chain SignedDataVerifier checks every JWS against.
 * Cached across requests; the same two files serve Sandbox and Production.
 */
function loadAppleRootCertificates(): Buffer[] {
  if (cachedRootCertificates) return cachedRootCertificates;
  const dir = join(__dirname, '../../../../certs/apple');
  cachedRootCertificates = ['AppleRootCA-G3.cer', 'AppleRootCA-G2.cer'].map((name) =>
    readFileSync(join(dir, name)),
  );
  return cachedRootCertificates;
}

function msToDate(ms: number | null | undefined): Date | null {
  return ms ? new Date(ms) : null;
}

/**
 * Apple IAP is receipt/notification driven rather than hosted-checkout driven:
 * `createCheckout` hands back the App Store product id for the client to
 * purchase natively via StoreKit (see expo-iap on mobile); the resulting
 * transaction is verified through `SubscriptionsService.verifyAppleTransaction`
 * (client-driven, for the *first* purchase — there is no checkout webhook to
 * link on), and App Store Server Notifications v2 keep the subscription in
 * sync afterwards via `verifyAndParseWebhook`.
 */
@Injectable()
export class AppleIapProvider implements PaymentProvider {
  readonly key: ProviderKey = 'apple_iap';
  private readonly logger = new Logger(AppleIapProvider.name);
  private apiClientInstance: AppStoreServerAPIClient | null = null;
  private verifierInstance: SignedDataVerifier | null = null;

  constructor(private readonly config: ConfigService) {}

  get available(): boolean {
    const cfg = this.appleConfig;
    return Boolean(cfg.bundleId && cfg.issuerId && cfg.keyId && cfg.privateKey);
  }

  private get appleConfig(): PaymentsConfig['appleIap'] {
    return this.config.getOrThrow<PaymentsConfig>('payments').appleIap;
  }

  private get environment(): Environment {
    return this.appleConfig.environment === 'Production'
      ? Environment.PRODUCTION
      : Environment.SANDBOX;
  }

  /** Lazily built so the app boots without keys; throws only when used. */
  private get apiClient(): AppStoreServerAPIClient {
    if (this.apiClientInstance) return this.apiClientInstance;
    const cfg = this.appleConfig;
    if (!cfg.issuerId || !cfg.keyId || !cfg.privateKey || !cfg.bundleId) {
      throw new ServiceUnavailableException('Apple IAP is not configured (APPLE_IAP_* env vars missing)');
    }
    this.apiClientInstance = new AppStoreServerAPIClient(
      cfg.privateKey,
      cfg.keyId,
      cfg.issuerId,
      cfg.bundleId,
      this.environment,
    );
    return this.apiClientInstance;
  }

  private get verifier(): SignedDataVerifier {
    if (this.verifierInstance) return this.verifierInstance;
    const cfg = this.appleConfig;
    if (!cfg.bundleId) {
      throw new ServiceUnavailableException('Apple IAP is not configured (APPLE_BUNDLE_ID missing)');
    }
    this.verifierInstance = new SignedDataVerifier(
      loadAppleRootCertificates(),
      true, // enableOnlineChecks: also check revocation + real-time expiry
      this.environment,
      cfg.bundleId,
      cfg.appAppleId ?? undefined,
    );
    return this.verifierInstance;
  }

  /** No hosted session — the client purchases `providerProductId` via StoreKit. */
  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    return {
      url: null,
      clientSecret: null,
      providerProductId: input.providerPriceId,
      providerRef: input.subscriptionId,
      providerCustomerId: input.providerCustomerId,
    };
  }

  async verifyAndParseWebhook(rawBody: Buffer, _signature: string): Promise<NormalizedEvent> {
    // Apple's whole payload is `{ signedPayload: "<JWS>" }` — the JWS itself
    // carries and verifies the signature (checked against Apple's certificate
    // chain below), so unlike Stripe/Paystack there is no separate header.
    let body: { signedPayload?: string };
    try {
      body = JSON.parse(rawBody.toString('utf8')) as { signedPayload?: string };
    } catch {
      throw new BadRequestException('Malformed Apple notification body');
    }
    if (!body.signedPayload) {
      throw new BadRequestException('Apple notification is missing signedPayload');
    }

    let payload: ResponseBodyV2DecodedPayload;
    try {
      payload = await this.verifier.verifyAndDecodeNotification(body.signedPayload);
    } catch (err) {
      // VerificationException (bad/foreign signature) → 400, same as Stripe's
      // signature-error mapping and Paystack's HMAC check; no retry loop for a
      // payload that can never verify.
      throw new BadRequestException(`Invalid Apple notification: ${(err as Error).message}`);
    }
    const { kind, objectId } = await this.classify(payload);

    return {
      providerEventId: payload.notificationUUID ?? `${payload.notificationType}:${payload.signedDate}`,
      type: payload.notificationType ?? 'UNKNOWN',
      kind,
      objectId,
      raw: payload,
    };
  }

  /**
   * Maps a notification onto our domain. `SUBSCRIBED`/`DID_RENEW` carry a new
   * transaction → `invoice.paid` (billing re-fetches + records it as a charge).
   * Everything else that changes subscription state (expiry, failed renewal,
   * revocation, auto-renew toggle) has no new transaction to record as an
   * invoice, so it maps to `subscription.updated` — Apple's webhook model is
   * subscription-centric, not invoice-centric like Stripe's.
   */
  private async classify(
    payload: ResponseBodyV2DecodedPayload,
  ): Promise<{ kind: NormalizedEventKind; objectId: string | null }> {
    const signedTransactionInfo = payload.data?.signedTransactionInfo;
    if (!signedTransactionInfo) return { kind: 'unhandled', objectId: null };

    const transaction = await this.verifier.verifyAndDecodeTransaction(signedTransactionInfo);
    const originalTransactionId = transaction.originalTransactionId ?? null;
    const transactionId = transaction.transactionId ?? null;

    switch (payload.notificationType) {
      case NotificationTypeV2.SUBSCRIBED:
      case NotificationTypeV2.DID_RENEW:
        return { kind: 'invoice.paid', objectId: transactionId };
      case NotificationTypeV2.DID_CHANGE_RENEWAL_STATUS:
      case NotificationTypeV2.DID_CHANGE_RENEWAL_PREF:
      case NotificationTypeV2.EXPIRED:
      case NotificationTypeV2.DID_FAIL_TO_RENEW:
      case NotificationTypeV2.GRACE_PERIOD_EXPIRED:
      case NotificationTypeV2.REFUND:
      case NotificationTypeV2.REVOKE:
        return { kind: 'subscription.updated', objectId: originalTransactionId };
      default:
        return { kind: 'unhandled', objectId: originalTransactionId };
    }
  }

  /** Re-fetch current status by the subscription's original transaction id. */
  async fetchSubscription(originalTransactionId: string): Promise<ProviderSubSnapshot> {
    const response = await this.apiClient.getAllSubscriptionStatuses(originalTransactionId);
    const item = (response.data ?? [])
      .flatMap((group) => group.lastTransactions ?? [])
      .find((t) => t.originalTransactionId === originalTransactionId);
    if (!item?.signedTransactionInfo) {
      throw new NotFoundException(`No Apple subscription found for ${originalTransactionId}`);
    }

    const transaction = await this.verifier.verifyAndDecodeTransaction(item.signedTransactionInfo);
    const renewal = item.signedRenewalInfo
      ? await this.verifier.verifyAndDecodeRenewalInfo(item.signedRenewalInfo)
      : null;

    return {
      providerSubscriptionId: originalTransactionId,
      // Apple has no separate "customer" concept — identity is the transaction chain.
      providerCustomerId: null,
      status: this.mapStatus(item.status),
      currentPeriodStart: msToDate(transaction.purchaseDate),
      currentPeriodEnd: msToDate(transaction.expiresDate),
      cancelAtPeriodEnd: renewal ? renewal.autoRenewStatus === AutoRenewStatus.OFF : false,
      canceledAt: msToDate(transaction.revocationDate),
      currency: (transaction.currency ?? 'USD').toLowerCase(),
    };
  }

  /** Re-fetch a single charge by transaction id (Apple's invoice analog). */
  async fetchInvoice(transactionId: string): Promise<ProviderInvoiceSnapshot> {
    const response = await this.apiClient.getTransactionInfo(transactionId);
    if (!response.signedTransactionInfo) {
      throw new NotFoundException(`No Apple transaction found for ${transactionId}`);
    }
    const transaction = await this.verifier.verifyAndDecodeTransaction(response.signedTransactionInfo);

    return {
      providerInvoiceId: transaction.transactionId ?? transactionId,
      providerSubscriptionId: transaction.originalTransactionId ?? null,
      // Apple only ever hands back transactions for completed purchases — there
      // is no "unpaid Apple invoice" the way Stripe has an OPEN invoice.
      status: 'PAID',
      // `price` is in milliunits (1/1000 of the currency's major unit); amountMinor
      // is minor units (1/100) — divide by 10.
      amountMinor: transaction.price != null ? Math.round(transaction.price / 10) : 0,
      currency: (transaction.currency ?? 'USD').toLowerCase(),
      periodStart: msToDate(transaction.purchaseDate),
      periodEnd: msToDate(transaction.expiresDate),
      providerPaymentId: transaction.transactionId ?? null,
      paymentStatus: 'PAID',
    };
  }

  /** Never called — Apple IAP never emits a `checkout.completed` event. */
  fetchCheckoutOutcome(_sessionId: string): Promise<CheckoutOutcome> {
    throw new NotImplementedException('Apple IAP has no hosted checkout to resolve');
  }

  /**
   * Apple gives no server-side cancel API — only the subscriber (via Settings >
   * [name] > Subscriptions) or Apple support can cancel. The client should deep
   * link to the native subscription-management screen instead of calling this.
   */
  cancelSubscription(_providerSubscriptionId: string, _atPeriodEnd: boolean): Promise<void> {
    throw new BadRequestException(
      'Apple subscriptions can only be managed by the subscriber, via Settings > Subscriptions on their device.',
    );
  }

  /**
   * Apple product ids can't be minted via API — they're created manually in App
   * Store Connect. This records the admin-supplied id rather than creating
   * anything; `manualProductId` comes from the admin UI's "Apple product id"
   * field, falling back to whatever was already recorded (a plain re-sync).
   */
  async syncPlanPrice(input: SyncPlanPriceInput): Promise<SyncPlanPriceResult> {
    const productId = input.manualProductId || input.existingProductId;
    if (!productId) {
      throw new BadRequestException(
        'Apple product ids are created manually in App Store Connect — provide the product id to record it.',
      );
    }
    return {
      // Apple has one identifier for both product and price — the App Store
      // Connect product id — unlike Stripe's separate product/price objects.
      providerProductId: productId,
      providerPriceId: productId,
      amountMinor: input.amountMinor,
      currency: input.currency,
      interval: input.interval,
    };
  }

  private mapStatus(status: Status | number | undefined): SubscriptionStatus {
    switch (status) {
      case Status.ACTIVE:
        return 'ACTIVE';
      case Status.BILLING_RETRY:
      case Status.BILLING_GRACE_PERIOD:
        return 'PAST_DUE';
      case Status.REVOKED:
        return 'CANCELED';
      case Status.EXPIRED:
        return 'EXPIRED';
      default:
        this.logger.warn(`Unmapped Apple subscription status: ${status}`);
        return 'INCOMPLETE';
    }
  }
}
