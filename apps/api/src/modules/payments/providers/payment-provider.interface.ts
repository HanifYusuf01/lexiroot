import type {
  InvoiceStatus,
  PaymentStatus,
  ProviderKey,
  SubscriptionStatus,
} from '@lexiroot/shared';

/**
 * The strategy every payment provider (Stripe, Paystack, Apple IAP) implements.
 * Providers translate their own API + webhook vocabulary INTO the neutral shapes
 * below — the rest of the app never sees a provider-specific type. Only Stripe
 * is implemented today; the others are stubs.
 */

/** Input for opening a subscription checkout. */
export interface CreateCheckoutInput {
  /** Our subscription row id — echoed back via metadata so we can link on return. */
  subscriptionId: string;
  userId: string;
  userEmail: string;
  /** Reused across checkouts so a user maps to one provider customer. */
  providerCustomerId: string | null;
  /** The provider price/plan to subscribe to. */
  providerPriceId: string;
  successUrl: string;
  cancelUrl: string;
  /** Stable key so a retried/double-clicked checkout doesn't create duplicates. */
  idempotencyKey: string;
}

export interface CheckoutResult {
  /** Hosted-checkout URL (Stripe). Null for in-app payment-sheet providers. */
  url: string | null;
  /** Client secret for in-app confirmation (future providers). */
  clientSecret: string | null;
  /** Provider's reference for the checkout attempt (e.g. session id). */
  providerRef: string;
  /** The customer the provider created/reused, to persist on our subscription. */
  providerCustomerId: string | null;
}

/** Normalized provider subscription state, re-fetched from the provider by id. */
export interface ProviderSubSnapshot {
  providerSubscriptionId: string;
  providerCustomerId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  currency: string;
}

/** Normalized provider invoice, re-fetched from the provider by id. */
export interface ProviderInvoiceSnapshot {
  providerInvoiceId: string;
  providerSubscriptionId: string | null;
  status: InvoiceStatus;
  amountMinor: number;
  currency: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  /** The charge/payment-intent id, if any. */
  providerPaymentId: string | null;
  paymentStatus: PaymentStatus | null;
}

/** Result of resolving a completed hosted-checkout, used to link provider ids. */
export interface CheckoutOutcome {
  /** Our subscription id, read back from checkout metadata. */
  subscriptionId: string | null;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
}

/** The domain transitions an inbound webhook can map to. */
export type NormalizedEventKind =
  | 'checkout.completed'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'subscription.updated'
  | 'subscription.deleted'
  | 'payment_method.updated'
  | 'unhandled';

/** A signature-verified, normalized inbound webhook. */
export interface NormalizedEvent {
  providerEventId: string;
  /** Raw provider event type, e.g. "invoice.paid". */
  type: string;
  kind: NormalizedEventKind;
  /** Id of the primary object to re-fetch (invoice/subscription/session id). */
  objectId: string | null;
  /** Raw event payload, stored for audit/disputes. */
  raw: unknown;
}

/** Input for provisioning a provider price/product from a catalog plan. */
export interface SyncPlanPriceInput {
  planName: string;
  amountMinor: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  existingProductId: string | null;
  existingPriceId: string | null;
}

export interface SyncPlanPriceResult {
  providerProductId: string;
  providerPriceId: string;
  amountMinor: number;
  currency: string;
  interval: string;
}

export interface PaymentProvider {
  readonly key: ProviderKey;

  /** Open a subscription checkout for the user. */
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;

  /**
   * Verify the webhook signature (throws if invalid — Rule 3a) and return a
   * normalized event. Must NOT trust the payload for state — callers re-fetch
   * via the fetch* methods (Rule 3b).
   */
  verifyAndParseWebhook(rawBody: Buffer, signature: string): NormalizedEvent;

  /** Re-fetch a subscription from the provider by id (source of truth). */
  fetchSubscription(providerSubscriptionId: string): Promise<ProviderSubSnapshot>;

  /** Re-fetch an invoice from the provider by id (source of truth). */
  fetchInvoice(providerInvoiceId: string): Promise<ProviderInvoiceSnapshot>;

  /** Resolve a completed checkout session to its provider subscription/customer. */
  fetchCheckoutOutcome(sessionId: string): Promise<CheckoutOutcome>;

  /** Cancel a subscription, deferring to period end when requested (Rule 5c). */
  cancelSubscription(providerSubscriptionId: string, atPeriodEnd: boolean): Promise<void>;

  /** Create/update the provider price+product for a catalog plan (admin sync). */
  syncPlanPrice(input: SyncPlanPriceInput): Promise<SyncPlanPriceResult>;
}
