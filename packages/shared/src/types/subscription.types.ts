/**
 * Payment & subscription domain types shared across api / admin / mobile.
 *
 * The model is deliberately **provider-neutral**: LexiRoot will bill through
 * Stripe, Paystack and Apple IAP. Every row records which `provider` produced it
 * plus that provider's opaque reference id — no Stripe-specific shapes leak into
 * the domain. See `PaymentProvider` on the API for the strategy that maps each
 * provider onto these enums.
 *
 * Statuses are stored as stable string codes; human labels come from the
 * `*_STATUS_TEXT` maps so labels can change without a data migration.
 */

/** Payment service providers we integrate with. Only `stripe` is live today. */
export const PROVIDER_KEYS = ['stripe', 'paystack', 'apple_iap'] as const;
export type ProviderKey = (typeof PROVIDER_KEYS)[number];

/** Human labels for providers, so UI never renders a raw key. */
export const PROVIDER_TEXT: Record<ProviderKey, string> = {
  stripe: 'Stripe',
  paystack: 'Paystack',
  apple_iap: 'Apple',
};

/**
 * Where the checkout was initiated from. The server can't infer this (a mobile
 * request looks like any other HTTP call), so the client declares it and the
 * server uses it to pick a provider — iOS must bill through Apple IAP, other
 * platforms fall to the regional card processor.
 */
export const CLIENT_PLATFORMS = ['ios', 'android', 'web'] as const;
export type ClientPlatform = (typeof CLIENT_PLATFORMS)[number];

/**
 * Subscription lifecycle. Access is granted for TRIALING/ACTIVE/PAST_DUE while
 * the period is still current (see entitlement rules on the API) — never gate on
 * a payment's success directly.
 *
 * INCOMPLETE → TRIALING → ACTIVE → PAST_DUE → CANCELED / EXPIRED, with an
 * optional PAUSED hold. `INCOMPLETE` is the checkout node — a subscription row
 * exists but the first payment has not landed, so it grants no access.
 * `TRIALING` is reserved for future use — today the "trial" is the free
 * one-level limit, not a provider trial.
 */
export const SUBSCRIPTION_STATUSES = [
  'INCOMPLETE',
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'PAUSED',
  'EXPIRED',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_STATUS_TEXT: Record<SubscriptionStatus, string> = {
  INCOMPLETE: 'Awaiting payment',
  TRIALING: 'Trial',
  ACTIVE: 'Active',
  PAST_DUE: 'Payment due',
  CANCELED: 'Cancelled',
  PAUSED: 'Paused',
  EXPIRED: 'Expired',
};

/** Statuses that grant access while the current period has not elapsed. */
export const ENTITLED_SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
];

/** Statuses from which a subscription can no longer be revived. */
export const TERMINAL_SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = ['EXPIRED'];

/** Invoice lifecycle — one invoice per subscription billing period. */
export const INVOICE_STATUSES = ['DRAFT', 'OPEN', 'PAID', 'UNCOLLECTIBLE', 'VOID'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_TEXT: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  OPEN: 'Awaiting payment',
  PAID: 'Paid',
  UNCOLLECTIBLE: 'Uncollectible',
  VOID: 'Void',
};

/** Payment (charge attempt) lifecycle. */
export const PAYMENT_STATUSES = [
  'INITIATED',
  'REQUIRES_ACTION',
  'PAID',
  'FAILED',
  'REFUNDED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_TEXT: Record<PaymentStatus, string> = {
  INITIATED: 'Processing',
  REQUIRES_ACTION: 'Action required',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  provider: ProviderKey;
  status: SubscriptionStatus;
  /** Display label for `status` (from SUBSCRIPTION_STATUS_TEXT). */
  statusText: string;
  /** ISO 8601. Start of the currently-paid billing period. */
  currentPeriodStart: string | null;
  /** ISO 8601. Access is retained until this instant (+grace). */
  currentPeriodEnd: string | null;
  /** True once the user has cancelled but access runs to period end. */
  cancelAtPeriodEnd: boolean;
  /** ISO 8601 currency code, lowercase e.g. "usd". Locked per subscription. */
  currency: string;
}

/**
 * Compact subscription view returned on `/auth/me` so clients can render the
 * lifecycle (current plan, renewal date, "cancels on X", past-due banner)
 * without a second request.
 */
export interface SubscriptionSummary {
  status: SubscriptionStatus;
  statusText: string;
  planId: string | null;
  /** ISO 8601. When ACTIVE and not cancelling, the next renewal date. */
  renewsOn: string | null;
  /** ISO 8601. When cancelling, the date access ends. */
  cancelsOn: string | null;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  provider: ProviderKey;
  status: InvoiceStatus;
  /** Integer minor units (cents/kobo). Never a float. */
  amountMinor: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  provider: ProviderKey;
  status: PaymentStatus;
  amountMinor: number;
  currency: string;
  attemptNo: number;
}

export interface PaymentMethod {
  id: string;
  provider: ProviderKey;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
}

/** Request body for POST /subscriptions/checkout. */
export interface CreateCheckoutRequest {
  planId: string;
  /**
   * The calling platform. Drives server-side provider resolution — clients
   * should send this and leave `provider` unset.
   */
  platform?: ClientPlatform;
  /**
   * Explicit provider override, bypassing resolution. Intended for admin/testing;
   * normal clients omit it and let the server resolve from `platform` + the
   * user's country. Rejected when that provider isn't live.
   */
  provider?: ProviderKey;
  /**
   * App deep link (e.g. `lexiroot://subscription-return`) the hosted checkout
   * should bounce back to after success/cancel. When set, the server points the
   * provider's success/cancel URLs at a web page that redirects to it — this is
   * how the mobile in-app browser closes and hands control back to the app.
   */
  returnDeepLink?: string;
}

/** A subscription row for the admin subscriptions table (cross-user). */
export interface AdminSubscription {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  planId: string;
  planName: string | null;
  provider: ProviderKey;
  status: SubscriptionStatus;
  statusText: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

/** Response from POST /subscriptions/checkout. */
export interface CreateCheckoutResponse {
  /** Hosted-checkout URL to redirect/open (Stripe). */
  url: string | null;
  /** Client secret for in-app payment sheets (future providers). */
  clientSecret: string | null;
  provider: ProviderKey;
}
