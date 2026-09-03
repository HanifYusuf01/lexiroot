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

import type { PlanChangeDirection } from './subscription-plan.types';

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
  /**
   * Null when there's no subscription (free tier). Apple IAP subscriptions
   * can't be cancelled through our API — Apple only lets the subscriber cancel,
   * via their device's Settings > Subscriptions — so the client must branch on
   * this before offering a "Cancel subscription" button.
   */
  provider: ProviderKey | null;
  /**
   * A downgrade the subscriber has already asked for that takes effect at the
   * end of the current period. Null when nothing is scheduled. They keep the
   * plan named by `planId` — and everything it grants — until then, which is
   * why this is a separate field rather than an early write to `planId`.
   */
  pendingPlanId: string | null;
  /** ISO 8601. When `pendingPlanId` takes over. Null when nothing is pending. */
  pendingPlanEffectiveAt: string | null;
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
  /** Start of the period `currentPeriodEnd` closes — the two are one billing
   *  period apart, unlike `createdAt`, which predates every renewal. */
  currentPeriodStart: string | null;
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
  /** Store product id to purchase natively via StoreKit (Apple IAP). */
  providerProductId: string | null;
  /**
   * Apple IAP only: pass as StoreKit's `appAccountToken` on the purchase
   * request, so Apple's transaction echoes back an id that ties to our
   * subscription row (support/fraud/restore-purchase reconciliation).
   */
  appAccountToken: string | null;
  provider: ProviderKey;
}

/** Request body for POST /subscriptions/apple-iap/verify. */
export interface VerifyAppleTransactionRequest {
  /** transactionId (or originalTransactionId) from the StoreKit purchase result. */
  transactionId: string;
}

/**
 * Family plan sharing. One paid family subscription entitles several separate
 * accounts — each keeps its own profile, language and progress; only the
 * entitlement is shared.
 *
 * Six seats *including the owner*, so a family owner can invite five others.
 */
export const FAMILY_MAX_SEATS = 6;

export type FamilySeatStatus = 'owner' | 'member' | 'pending';

export interface FamilySeat {
  /** Membership row id; null for the owner, who has no membership row. */
  id: string | null;
  status: FamilySeatStatus;
  /** Null while an invite is still pending — nobody has accepted it yet. */
  userId: string | null;
  email: string;
  displayName: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
}

export interface FamilyOverview {
  /**
   * Whether family sharing applies to the caller at all — either they own a
   * plan that includes it, or they hold a seat on somebody else's.
   *
   * Not the same as `isOwner`: a member has no family subscription of their own
   * but is very much on one, and telling them otherwise is a lie they can
   * disprove by looking at their unlocked lessons.
   */
  enabled: boolean;
  /** True when the caller owns the subscription (only owners may invite). */
  isOwner: boolean;
  maxSeats: number;
  /** Owner + accepted members + still-pending invites. */
  usedSeats: number;
  /**
   * The people on the plan. Populated for the owner, who manages them; empty
   * for a member, who has no business seeing the other members' addresses.
   */
  seats: FamilySeat[];
  /**
   * Member view only: who owns the plan they're on, so the screen can say whose
   * it is. Null for an owner (it's theirs) and when nothing applies.
   */
  ownerName: string | null;
}

export interface FamilyInvitePreview {
  email: string;
  /** Display name of whoever sent the invite, for the accept screen. */
  invitedByName: string | null;
  planName: string | null;
  expiresAt: string;
}

export interface AcceptFamilyInviteResult {
  /**
   * True when the accepting user already had their own live subscription.
   * They keep both — the client warns them they're still being billed.
   */
  hadOwnSubscription: boolean;
}

/**
 * Request body for POST /subscriptions/change-plan — move an existing, live
 * subscription onto a different plan. Distinct from checkout, which opens a
 * *new* subscription and is rejected outright while one is live.
 */
export interface ChangePlanRequest {
  /** The plan to move onto. Must differ in rank from the current one. */
  planId: string;
  /** Calling platform, same meaning as on checkout (drives the Apple branch). */
  platform?: ClientPlatform;
  /**
   * Acknowledges that this change ends the seats of everyone on the caller's
   * family plan. Required — the request is refused without it — whenever the
   * target plan drops family sharing and people are still on the plan, so
   * nobody's access can be taken away by a tap that never mentioned them.
   *
   * It is an acknowledgement, not an instruction to act now: the seats end when
   * the plan change itself takes effect, at the end of the paid period.
   */
  confirmRemovesSeats?: boolean;
}

/**
 * How a requested plan change is being carried out.
 *
 * - `applied`   — done: the subscriber is on the new plan now and the provider
 *                 has invoiced the difference. Upgrades on a card provider.
 * - `scheduled` — accepted, takes effect at `effectiveAt` (the end of the paid
 *                 period). Downgrades: they paid for the bigger plan through
 *                 the end of this period, so they keep it until then.
 * - `store`     — nothing changed server-side yet. Apple owns the money for an
 *                 IAP subscription, so the client must run a StoreKit purchase
 *                 of `providerProductId` in the same subscription group; Apple
 *                 then applies an upgrade immediately or a downgrade at
 *                 renewal, and tells us via App Store Server Notifications.
 */
export const PLAN_CHANGE_MODES = ['applied', 'scheduled', 'store'] as const;
export type PlanChangeMode = (typeof PLAN_CHANGE_MODES)[number];

/** Response from POST /subscriptions/change-plan. */
export interface ChangePlanResponse {
  mode: PlanChangeMode;
  direction: PlanChangeDirection;
  /** The plan being moved onto. */
  planId: string;
  /** ISO 8601 for `scheduled`; null when it is already in force or store-driven. */
  effectiveAt: string | null;
  /** `store` mode only: the App Store product the client must purchase. */
  providerProductId: string | null;
  /** `store` mode only: pass as StoreKit's `appAccountToken`, as on checkout. */
  appAccountToken: string | null;
  provider: ProviderKey;
}
