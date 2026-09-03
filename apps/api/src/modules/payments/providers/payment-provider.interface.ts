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
  /**
   * The recurring amount in minor units, from the synced provider price. Stripe
   * ignores it (the price drives the charge), but Paystack's
   * `/transaction/initialize` requires a valid `amount` even when a plan is set —
   * it is validated before the plan is read, so omitting it fails with "Invalid
   * Amount Sent". Paystack then charges the plan's own amount, not this value.
   */
  amountMinor: number;
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
  /**
   * Store product id to purchase via a native purchase sheet (Apple IAP). Null
   * for hosted-checkout providers, which need no client-side product lookup.
   */
  providerProductId: string | null;
  /** Provider's reference for the checkout attempt (e.g. session id). */
  providerRef: string;
  /** The customer the provider created/reused, to persist on our subscription. */
  providerCustomerId: string | null;
}

/** Normalized provider subscription state, re-fetched from the provider by id. */
export interface ProviderSubSnapshot {
  providerSubscriptionId: string;
  providerCustomerId: string | null;
  /**
   * The opaque account token we attached when the purchase was opened, echoed
   * back by the provider. Apple carries it on every transaction in the chain
   * (including renewals); it is how a purchase is proved to belong to the
   * account that started it. Null for providers whose checkout is already bound
   * to our subscription server-side.
   */
  appAccountToken?: string | null;
  /**
   * The product the subscription currently bills for, when the provider says so
   * cheaply. Apple fills it (a plan change inside a subscription group keeps the
   * same subscription and swaps the product id, which is the only signal that
   * the plan moved); Stripe and Paystack return null — their plan changes are
   * server-initiated, so we already know.
   */
  providerProductId?: string | null;
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
  /**
   * Admin-supplied product id for providers with no product-creation API (Apple
   * IAP: the id is minted manually in App Store Connect, not by us). Ignored by
   * providers that create their own products (Stripe, Paystack).
   */
  manualProductId?: string | null;
}

export interface SyncPlanPriceResult {
  providerProductId: string;
  providerPriceId: string;
  amountMinor: number;
  currency: string;
  interval: string;
}

/** Input for moving a live subscription onto a different price. */
export interface ChangePlanInput {
  providerSubscriptionId: string;
  /** The price to move onto. */
  providerPriceId: string;
  /**
   * Whether the new price takes effect now, invoicing the prorated difference
   * (an upgrade), or from the next renewal with no charge or credit today (a
   * downgrade — the current period is already paid for at the higher price).
   */
  immediate: boolean;
  /** Stable key so a retried/double-tapped change doesn't charge twice. */
  idempotencyKey: string;
}

export interface PaymentProvider {
  readonly key: ProviderKey;

  /**
   * Whether this provider can actually take a payment right now — implemented
   * AND configured. Checkout resolution skips unavailable providers, so an
   * unimplemented stub silently falls through to the next preference instead of
   * throwing 501 at a user. Flip a stub to `true` once it's live and routing
   * picks it up with no other change.
   */
  readonly available: boolean;

  /** Open a subscription checkout for the user. */
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;

  /**
   * Verify the webhook signature (throws if invalid — Rule 3a) and return a
   * normalized event. Must NOT trust the payload for state — callers re-fetch
   * via the fetch* methods (Rule 3b). Async because Apple IAP's verification is
   * a JWS check against Apple's certificate chain, not a synchronous HMAC/SDK
   * call like Stripe/Paystack.
   */
  verifyAndParseWebhook(rawBody: Buffer, signature: string): Promise<NormalizedEvent>;

  /** Re-fetch a subscription from the provider by id (source of truth). */
  fetchSubscription(providerSubscriptionId: string): Promise<ProviderSubSnapshot>;

  /** Re-fetch an invoice from the provider by id (source of truth). */
  fetchInvoice(providerInvoiceId: string): Promise<ProviderInvoiceSnapshot>;

  /** Resolve a completed checkout session to its provider subscription/customer. */
  fetchCheckoutOutcome(sessionId: string): Promise<CheckoutOutcome>;

  /** Cancel a subscription, deferring to period end when requested (Rule 5c). */
  cancelSubscription(providerSubscriptionId: string, atPeriodEnd: boolean): Promise<void>;

  /**
   * Move a live subscription onto a different price, keeping the same
   * subscription (and its billing anchor) rather than opening a new one.
   *
   * Providers that can't do this — Apple IAP, where only the subscriber can
   * change plan, from inside the app via StoreKit — throw, and the caller must
   * not reach them. `SubscriptionsService.changePlan` routes Apple to the
   * client instead.
   */
  changePlan(input: ChangePlanInput): Promise<void>;

  /** Create/update the provider price+product for a catalog plan (admin sync). */
  syncPlanPrice(input: SyncPlanPriceInput): Promise<SyncPlanPriceResult>;
}
