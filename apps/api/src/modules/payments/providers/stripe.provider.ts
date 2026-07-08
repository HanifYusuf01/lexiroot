import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type {
  InvoiceStatus,
  PaymentStatus,
  ProviderKey,
  SubscriptionStatus,
} from '@lexiroot/shared';
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

@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly key: ProviderKey = 'stripe';
  private readonly logger = new Logger(StripeProvider.name);
  private client: Stripe | null = null;

  constructor(private readonly config: ConfigService) {}

  /** Implemented — live wherever a secret key is configured. */
  get available(): boolean {
    return Boolean(this.config.getOrThrow<PaymentsConfig>('payments').stripe.secretKey);
  }

  /** Lazily built so the app boots without keys; throws only when used. */
  private get stripe(): Stripe {
    if (this.client) return this.client;
    const cfg = this.config.getOrThrow<PaymentsConfig>('payments');
    if (!cfg.stripe.secretKey) {
      throw new ServiceUnavailableException('Stripe is not configured (STRIPE_SECRET_KEY missing)');
    }
    // Use the SDK's own pinned API version (it is sent with every request and
    // matches these type definitions). The mapping helpers below read period /
    // subscription / payment fields defensively so they work whether the object
    // carries them on the subscription, its items, or invoice.parent.
    this.client = new Stripe(cfg.stripe.secretKey);
    return this.client;
  }

  private get webhookSecret(): string {
    const cfg = this.config.getOrThrow<PaymentsConfig>('payments');
    if (!cfg.stripe.webhookSecret) {
      throw new ServiceUnavailableException('Stripe webhook secret is not configured');
    }
    return cfg.stripe.webhookSecret;
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const metadata = { subscriptionId: input.subscriptionId, userId: input.userId };
    const session = await this.stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        line_items: [{ price: input.providerPriceId, quantity: 1 }],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        client_reference_id: input.subscriptionId,
        metadata,
        subscription_data: { metadata },
        ...(input.providerCustomerId
          ? { customer: input.providerCustomerId }
          : { customer_email: input.userEmail }),
      },
      { idempotencyKey: input.idempotencyKey },
    );

    return {
      url: session.url,
      clientSecret: null,
      providerRef: session.id,
      providerCustomerId:
        typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null),
    };
  }

  verifyAndParseWebhook(rawBody: Buffer, signature: string): NormalizedEvent {
    // Throws Stripe.errors.StripeSignatureVerificationError on a bad signature.
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    const obj = event.data.object as { id?: string };
    let kind: NormalizedEventKind = 'unhandled';

    switch (event.type) {
      case 'checkout.session.completed':
        kind = 'checkout.completed';
        break;
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
        kind = 'invoice.paid';
        break;
      case 'invoice.payment_failed':
        kind = 'invoice.payment_failed';
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        kind = 'subscription.updated';
        break;
      case 'customer.subscription.deleted':
        kind = 'subscription.deleted';
        break;
      case 'payment_method.attached':
      case 'payment_method.updated':
      case 'payment_method.automatically_updated':
        kind = 'payment_method.updated';
        break;
      default:
        kind = 'unhandled';
    }

    return {
      providerEventId: event.id,
      type: event.type,
      kind,
      objectId: obj?.id ?? null,
      raw: event,
    };
  }

  async fetchSubscription(providerSubscriptionId: string): Promise<ProviderSubSnapshot> {
    const sub = await this.stripe.subscriptions.retrieve(providerSubscriptionId);
    return this.mapSubscription(sub);
  }

  async fetchInvoice(providerInvoiceId: string): Promise<ProviderInvoiceSnapshot> {
    const invoice = await this.stripe.invoices.retrieve(providerInvoiceId);
    return this.mapInvoice(invoice);
  }

  async fetchCheckoutOutcome(sessionId: string): Promise<CheckoutOutcome> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    return {
      subscriptionId: session.metadata?.subscriptionId ?? session.client_reference_id ?? null,
      providerSubscriptionId:
        typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription?.id ?? null),
      providerCustomerId:
        typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null),
    };
  }

  async cancelSubscription(providerSubscriptionId: string, atPeriodEnd: boolean): Promise<void> {
    if (atPeriodEnd) {
      await this.stripe.subscriptions.update(providerSubscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      await this.stripe.subscriptions.cancel(providerSubscriptionId);
    }
  }

  async syncPlanPrice(input: SyncPlanPriceInput): Promise<SyncPlanPriceResult> {
    // Product: reuse if we have one, else create.
    let productId = input.existingProductId;
    if (productId) {
      await this.stripe.products.update(productId, { name: input.planName });
    } else {
      const product = await this.stripe.products.create({ name: input.planName });
      productId = product.id;
    }

    // Stripe prices are immutable — reuse only when everything matches.
    if (input.existingPriceId) {
      try {
        const existing = await this.stripe.prices.retrieve(input.existingPriceId);
        const matches =
          existing.active &&
          existing.unit_amount === input.amountMinor &&
          existing.currency === input.currency.toLowerCase() &&
          existing.recurring?.interval === input.interval &&
          (existing.recurring?.interval_count ?? 1) === input.intervalCount;
        if (matches) {
          return {
            providerProductId: productId,
            providerPriceId: existing.id,
            amountMinor: input.amountMinor,
            currency: input.currency,
            interval: input.interval,
          };
        }
        // Superseded — archive the old price so it stops being offered.
        await this.stripe.prices.update(input.existingPriceId, { active: false });
      } catch (err) {
        this.logger.warn(`Could not reconcile existing price ${input.existingPriceId}: ${err}`);
      }
    }

    const price = await this.stripe.prices.create({
      product: productId,
      unit_amount: input.amountMinor,
      currency: input.currency.toLowerCase(),
      recurring: { interval: input.interval, interval_count: input.intervalCount },
    });

    return {
      providerProductId: productId,
      providerPriceId: price.id,
      amountMinor: input.amountMinor,
      currency: input.currency,
      interval: input.interval,
    };
  }

  // --- mapping helpers: Stripe vocabulary → neutral domain shapes ---

  private mapSubscription(sub: Stripe.Subscription): ProviderSubSnapshot {
    // current_period_* live on the sub in the pinned API version, but fall back
    // to the first item in case a newer version is negotiated.
    const raw = sub as unknown as {
      current_period_start?: number | null;
      current_period_end?: number | null;
      items?: { data?: Array<{ current_period_start?: number; current_period_end?: number }> };
    };
    const item = raw.items?.data?.[0];
    const periodStart = raw.current_period_start ?? item?.current_period_start ?? null;
    const periodEnd = raw.current_period_end ?? item?.current_period_end ?? null;

    return {
      providerSubscriptionId: sub.id,
      providerCustomerId:
        typeof sub.customer === 'string' ? sub.customer : (sub.customer?.id ?? null),
      status: this.mapSubStatus(sub.status),
      currentPeriodStart: unixToDate(periodStart),
      currentPeriodEnd: unixToDate(periodEnd),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: unixToDate(sub.canceled_at),
      currency: (sub.currency ?? 'usd').toLowerCase(),
    };
  }

  private mapInvoice(invoice: Stripe.Invoice): ProviderInvoiceSnapshot {
    const raw = invoice as unknown as {
      subscription?: string | { id: string } | null;
      payment_intent?: string | Stripe.PaymentIntent | null;
      parent?: { subscription_details?: { subscription?: string | { id: string } } };
    };
    const subRef = raw.subscription ?? raw.parent?.subscription_details?.subscription ?? null;
    const providerSubscriptionId =
      typeof subRef === 'string' ? subRef : (subRef?.id ?? null);

    const pi = raw.payment_intent;
    let providerPaymentId: string | null = null;
    let paymentStatus: PaymentStatus | null = null;
    if (pi && typeof pi === 'object') {
      providerPaymentId = pi.id;
      paymentStatus = this.mapPaymentIntentStatus(pi.status);
    } else if (typeof pi === 'string') {
      providerPaymentId = pi;
    }
    // Fall back to the invoice's own paid flag when the PI wasn't expanded.
    if (!paymentStatus && invoice.status === 'paid') paymentStatus = 'PAID';

    return {
      providerInvoiceId: invoice.id ?? '',
      providerSubscriptionId,
      status: this.mapInvoiceStatus(invoice.status),
      amountMinor: invoice.amount_due ?? invoice.total ?? 0,
      currency: (invoice.currency ?? 'usd').toLowerCase(),
      periodStart: unixToDate(invoice.period_start),
      periodEnd: unixToDate(invoice.period_end),
      providerPaymentId,
      paymentStatus,
    };
  }

  private mapSubStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
      case 'trialing':
        return 'TRIALING';
      case 'active':
        return 'ACTIVE';
      case 'past_due':
      case 'unpaid':
        return 'PAST_DUE';
      case 'canceled':
        return 'CANCELED';
      case 'paused':
        return 'PAUSED';
      case 'incomplete_expired':
        return 'EXPIRED';
      case 'incomplete':
      default:
        return 'INCOMPLETE';
    }
  }

  private mapInvoiceStatus(status: Stripe.Invoice.Status | null): InvoiceStatus {
    switch (status) {
      case 'open':
        return 'OPEN';
      case 'paid':
        return 'PAID';
      case 'uncollectible':
        return 'UNCOLLECTIBLE';
      case 'void':
        return 'VOID';
      case 'draft':
      default:
        return 'DRAFT';
    }
  }

  private mapPaymentIntentStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
    switch (status) {
      case 'succeeded':
        return 'PAID';
      case 'processing':
        return 'INITIATED';
      case 'canceled':
        return 'FAILED';
      case 'requires_action':
      case 'requires_confirmation':
      case 'requires_payment_method':
      case 'requires_capture':
        return 'REQUIRES_ACTION';
      default:
        return 'INITIATED';
    }
  }
}

function unixToDate(seconds: number | null | undefined): Date | null {
  return seconds ? new Date(seconds * 1000) : null;
}
