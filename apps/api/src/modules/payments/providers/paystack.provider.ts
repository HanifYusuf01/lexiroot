import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ProviderKey, SubscriptionStatus } from '@lexiroot/shared';
import type { PaymentsConfig } from '../../../config/payments.config';
import { PaystackClient } from './paystack.client';
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

/**
 * Paystack payment provider. Maps Paystack's vocabulary onto the same neutral
 * shapes as Stripe. Paystack's model differs in ways worth knowing:
 *
 * - There is no "product" — a Plan (PLN_…) is the price. Plans are mutable
 *   (unlike Stripe prices), so a re-sync updates in place.
 * - Checkout is `POST /transaction/initialize` with a `plan`; Paystack creates
 *   the subscription (SUB_…) itself after the first successful charge.
 * - Webhooks are signed with HMAC-SHA512 of the raw body using the SAME secret
 *   key (no separate webhook secret), in the `x-paystack-signature` header.
 * - There is no "cancel immediately" API (that would imply a refund). Disabling
 *   a subscription makes it `non-renewing`: access runs to the paid period end.
 *
 * Linkage back to our subscription rides on the transaction `reference` (which
 * we set) + `metadata.subscriptionId`. The provider subscription code (SUB_…) is
 * resolved by listing the customer's subscriptions for the plan — Paystack does
 * not echo our metadata onto the subscription object.
 */
@Injectable()
export class PaystackProvider implements PaymentProvider {
  readonly key: ProviderKey = 'paystack';
  private readonly logger = new Logger(PaystackProvider.name);
  private client: PaystackClient | null = null;

  constructor(private readonly config: ConfigService) {}

  get available(): boolean {
    return Boolean(this.paystackConfig.secretKey);
  }

  private get paystackConfig(): PaymentsConfig['paystack'] {
    return this.config.getOrThrow<PaymentsConfig>('payments').paystack;
  }

  private get api(): PaystackClient {
    if (this.client) return this.client;
    const { secretKey } = this.paystackConfig;
    if (!secretKey) {
      throw new ServiceUnavailableException('Paystack is not configured (PAYSTACK_SECRET_KEY missing)');
    }
    this.client = new PaystackClient(secretKey);
    return this.client;
  }

  // --- checkout ---

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const reference = toPaystackReference(input.idempotencyKey);
    const res = await this.api.post<InitializeResponse>('/transaction/initialize', {
      email: input.userEmail,
      // With `plan` set, Paystack charges the plan's amount and opens a
      // subscription on the first successful charge — no `amount` needed.
      plan: input.providerPriceId,
      reference,
      callback_url: input.successUrl,
      metadata: { subscriptionId: input.subscriptionId, userId: input.userId },
    });

    return {
      url: res.authorization_url,
      clientSecret: null,
      providerRef: res.reference,
      // Customer code isn't known until the charge lands; filled in via webhook.
      providerCustomerId: null,
    };
  }

  async fetchCheckoutOutcome(reference: string): Promise<CheckoutOutcome> {
    const txn = await this.api.get<TransactionData>(`/transaction/verify/${encodeURIComponent(reference)}`);
    const planCode = planCodeOf(txn.plan);
    const providerSubscriptionId =
      txn.customer?.id != null && planCode
        ? await this.resolveSubscriptionCode(txn.customer.id, planCode)
        : null;

    return {
      subscriptionId: (txn.metadata?.subscriptionId as string | undefined) ?? null,
      providerSubscriptionId,
      providerCustomerId: txn.customer?.customer_code ?? null,
    };
  }

  // --- webhooks ---

  verifyAndParseWebhook(rawBody: Buffer, signature: string): NormalizedEvent {
    this.assertValidSignature(rawBody, signature);

    const event = JSON.parse(rawBody.toString('utf8')) as PaystackEvent;
    const kind = mapEventKind(event.event);

    return {
      // Paystack has no event id in the payload — derive a stable dedup key from
      // the event name + the object it concerns so replays collapse to one row.
      providerEventId: `${event.event}:${webhookObjectId(event) ?? 'unknown'}`,
      type: event.event,
      kind,
      objectId: webhookObjectId(event),
      raw: event,
    };
  }

  private assertValidSignature(rawBody: Buffer, signature: string): void {
    const { secretKey } = this.paystackConfig;
    if (!secretKey) throw new ServiceUnavailableException('Paystack webhook secret is not configured');

    const expected = createHmac('sha512', secretKey).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature ?? '');
    // timingSafeEqual throws on length mismatch — guard so a wrong-length header
    // is a clean rejection, not a 500.
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException('Invalid Paystack signature');
    }
  }

  // --- re-fetch (source of truth) ---

  async fetchSubscription(providerSubscriptionId: string): Promise<ProviderSubSnapshot> {
    const sub = await this.api.get<SubscriptionData>(
      `/subscription/${encodeURIComponent(providerSubscriptionId)}`,
    );
    return this.mapSubscription(sub);
  }

  /**
   * Paystack has no retrievable "invoice" object. We synthesize one:
   * - a transaction reference → verify it (a paid renewal/first charge)
   * - a subscription code (`SUB_…`) → a failed charge with no transaction; read
   *   the subscription for its amount/period and report an unpaid invoice.
   */
  async fetchInvoice(providerInvoiceId: string): Promise<ProviderInvoiceSnapshot> {
    if (providerInvoiceId.startsWith('SUB_')) {
      const sub = await this.api.get<SubscriptionData>(
        `/subscription/${encodeURIComponent(providerInvoiceId)}`,
      );
      return {
        providerInvoiceId,
        providerSubscriptionId: sub.subscription_code,
        status: 'OPEN',
        amountMinor: sub.amount ?? planAmountOf(sub.plan) ?? 0,
        currency: (currencyOf(sub) ?? 'ngn').toLowerCase(),
        periodStart: null,
        periodEnd: parseDate(sub.next_payment_date),
        providerPaymentId: null,
        paymentStatus: 'FAILED',
      };
    }

    const txn = await this.api.get<TransactionData>(
      `/transaction/verify/${encodeURIComponent(providerInvoiceId)}`,
    );
    const planCode = planCodeOf(txn.plan);
    const providerSubscriptionId =
      txn.customer?.id != null && planCode
        ? await this.resolveSubscriptionCode(txn.customer.id, planCode)
        : null;
    const paid = txn.status === 'success';

    return {
      providerInvoiceId,
      providerSubscriptionId,
      status: paid ? 'PAID' : 'OPEN',
      amountMinor: txn.amount ?? 0,
      currency: (txn.currency ?? 'ngn').toLowerCase(),
      periodStart: null,
      periodEnd: parseDate(txn.paid_at),
      providerPaymentId: String(txn.id),
      paymentStatus: paid ? 'PAID' : 'FAILED',
    };
  }

  // --- lifecycle ---

  async cancelSubscription(providerSubscriptionId: string, _atPeriodEnd: boolean): Promise<void> {
    // Paystack cannot cancel mid-period (no refund path). Disabling makes it
    // non-renewing → access runs to the period end regardless of `atPeriodEnd`.
    const sub = await this.api.get<SubscriptionData>(
      `/subscription/${encodeURIComponent(providerSubscriptionId)}`,
    );
    if (!sub.email_token) {
      throw new ServiceUnavailableException('Paystack subscription is missing its email token');
    }
    await this.api.post('/subscription/disable', {
      code: sub.subscription_code,
      token: sub.email_token,
    });
  }

  async syncPlanPrice(input: SyncPlanPriceInput): Promise<SyncPlanPriceResult> {
    const interval = mapInterval(input.interval, input.intervalCount);
    // No currency baked in: when PAYSTACK_CURRENCY is unset, Paystack creates the
    // plan in the account's own default currency — so the deployment isn't tied
    // to any one country. We read the real currency back below.
    const override = this.paystackConfig.currency;
    const body = {
      name: input.planName,
      amount: input.amountMinor,
      interval,
      ...(override ? { currency: override } : {}),
    };

    // Plans are mutable: update in place when we already have a plan code.
    const plan = input.existingPriceId
      ? await this.api.put<PlanData>(`/plan/${encodeURIComponent(input.existingPriceId)}`, body)
      : await this.api.post<PlanData>('/plan', body);

    // Update returns limited data; fall back to the code we already had.
    const planCode = plan.plan_code ?? input.existingPriceId;
    if (!planCode) {
      throw new ServiceUnavailableException('Paystack did not return a plan code');
    }

    // Authoritative currency: from the response, else the override, else re-read
    // the plan (a PUT can return a trimmed object without the currency).
    let currency = plan.currency ?? override;
    if (!currency) {
      const full = await this.api.get<PlanData>(`/plan/${encodeURIComponent(planCode)}`);
      currency = full.currency ?? null;
    }
    if (!currency) {
      throw new ServiceUnavailableException(
        'Paystack did not report a plan currency; set PAYSTACK_CURRENCY to your account currency.',
      );
    }

    return {
      providerProductId: planCode, // Paystack has no product; the plan is both.
      providerPriceId: planCode,
      amountMinor: input.amountMinor,
      currency,
      interval,
    };
  }

  // --- helpers ---

  /** Find the customer's subscription code for a plan (Paystack won't echo our ids). */
  private async resolveSubscriptionCode(
    customerId: number,
    planCode: string,
  ): Promise<string | null> {
    const list = await this.api.get<SubscriptionData[]>(
      `/subscription?customer=${customerId}&perPage=50`,
    );
    const match = list
      .filter((s) => planCodeOf(s.plan) === planCode)
      // Prefer a live one; otherwise the most recent.
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .sort((a, b) => Number(isLive(b.status)) - Number(isLive(a.status)));
    if (!match[0]) {
      this.logger.warn(`No Paystack subscription found for customer ${customerId} plan ${planCode}`);
      return null;
    }
    return match[0].subscription_code;
  }

  private mapSubscription(sub: SubscriptionData): ProviderSubSnapshot {
    const status = mapSubStatus(sub.status);
    return {
      providerSubscriptionId: sub.subscription_code,
      providerCustomerId: sub.customer?.customer_code ?? null,
      status,
      // Paystack exposes no period start; next_payment_date is the boundary
      // entitlement cares about (current paid period end / next renewal).
      currentPeriodStart: null,
      currentPeriodEnd: parseDate(sub.next_payment_date),
      // "non-renewing" = active now, won't renew → our cancel-at-period-end.
      cancelAtPeriodEnd: sub.status === 'non-renewing',
      canceledAt: sub.status === 'cancelled' ? parseDate(sub.updatedAt) : null,
      currency: (currencyOf(sub) ?? 'ngn').toLowerCase(),
    };
  }
}

// --- pure mapping functions (Paystack vocabulary → neutral) ---

/** Paystack subscription status → our lifecycle status. */
function mapSubStatus(status: string | undefined): SubscriptionStatus {
  switch (status) {
    case 'active':
    case 'non-renewing': // still entitled this period; flagged via cancelAtPeriodEnd
      return 'ACTIVE';
    case 'attention':
      return 'PAST_DUE';
    case 'completed':
      return 'EXPIRED';
    case 'cancelled':
      return 'CANCELED';
    default:
      return 'INCOMPLETE';
  }
}

function isLive(status: string | undefined): boolean {
  return status === 'active' || status === 'non-renewing' || status === 'attention';
}

/** Map our (interval, count) to a Paystack plan interval. Paystack has no count. */
function mapInterval(interval: 'month' | 'year', count: number): string {
  if (interval === 'year' && count === 1) return 'annually';
  if (interval === 'month' && count === 1) return 'monthly';
  if (interval === 'month' && count === 3) return 'quarterly';
  if (interval === 'month' && count === 6) return 'biannually';
  throw new BadRequestException(
    `Paystack has no billing interval for ${count}×${interval}. Supported: monthly, quarterly, biannually, annually.`,
  );
}

function mapEventKind(event: string): NormalizedEventKind {
  switch (event) {
    case 'charge.success':
      return 'checkout.completed';
    case 'invoice.update':
    case 'invoice.payment_success':
      return 'invoice.paid';
    case 'invoice.payment_failed':
      return 'invoice.payment_failed';
    case 'subscription.create':
    case 'subscription.disable':
    case 'subscription.not_renew':
    case 'subscription.enable':
      return 'subscription.updated';
    default:
      return 'unhandled';
  }
}

/** The id we re-fetch by for each event kind (reference, sub code, etc.). */
function webhookObjectId(event: PaystackEvent): string | null {
  const d = event.data ?? {};
  switch (event.event) {
    case 'charge.success':
      return d.reference ?? null;
    case 'invoice.update':
    case 'invoice.payment_success':
      // A paid renewal — re-fetch the transaction that settled it.
      return d.transaction?.reference ?? d.subscription?.subscription_code ?? null;
    case 'invoice.payment_failed':
      // No successful transaction; re-fetch via the subscription code.
      return d.subscription?.subscription_code ?? null;
    case 'subscription.create':
    case 'subscription.disable':
    case 'subscription.not_renew':
    case 'subscription.enable':
      return d.subscription_code ?? null;
    default:
      return null;
  }
}

/** `data.plan` may be a bare code string or an object. */
function planCodeOf(plan: string | { plan_code?: string } | null | undefined): string | null {
  if (!plan) return null;
  return typeof plan === 'string' ? plan : (plan.plan_code ?? null);
}

function planAmountOf(plan: string | { amount?: number } | null | undefined): number | null {
  return plan && typeof plan === 'object' ? (plan.amount ?? null) : null;
}

function currencyOf(sub: SubscriptionData): string | null {
  if (sub.currency) return sub.currency;
  if (sub.plan && typeof sub.plan === 'object') return sub.plan.currency ?? null;
  return null;
}

/**
 * Paystack transaction references allow only alphanumerics and `-.=`. Map our
 * idempotency key into that charset so the same checkout attempt reuses the same
 * reference (Paystack dedups on it).
 */
function toPaystackReference(idempotencyKey: string): string {
  return idempotencyKey.replace(/[^A-Za-z0-9.=-]/g, '-');
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// --- minimal Paystack response shapes (only the fields we read) ---

interface InitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackCustomer {
  id?: number;
  customer_code?: string;
  email?: string;
}

interface PaystackPlanRef {
  plan_code?: string;
  amount?: number;
  currency?: string;
}

interface TransactionData {
  id: number;
  status?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  paid_at?: string | null;
  customer?: PaystackCustomer;
  plan?: string | PaystackPlanRef | null;
  metadata?: Record<string, unknown> | null;
}

interface SubscriptionData {
  subscription_code: string;
  email_token?: string;
  status?: string;
  amount?: number;
  currency?: string;
  next_payment_date?: string | null;
  createdAt?: string;
  updatedAt?: string;
  customer?: PaystackCustomer;
  plan?: string | PaystackPlanRef | null;
}

interface PlanData {
  plan_code?: string;
  name?: string;
  amount?: number;
  interval?: string;
  currency?: string;
}

interface PaystackEvent {
  event: string;
  data?: {
    reference?: string;
    subscription_code?: string;
    transaction?: { reference?: string };
    subscription?: { subscription_code?: string };
    [key: string]: unknown;
  };
}
