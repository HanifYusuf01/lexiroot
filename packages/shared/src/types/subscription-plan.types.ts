import type { CurrencyCode } from '../constants';
import type { PlanFeatureKey } from '../constants/plan-features';
import type { ProviderKey } from './subscription.types';

export const PLAN_SCOPES = ['individual', 'family'] as const;
export type PlanScope = (typeof PLAN_SCOPES)[number];

/**
 * The billing period a plan charges on. This is the source of truth for the
 * interval (no longer inferred from the plan name): `Month` charges every month,
 * `Quarter` every three months, `Year` once a year. The plan's `price` is the
 * amount charged once per this period.
 */
export const PLAN_PERIODS = ['Month', 'Quarter', 'Year'] as const;
export type PlanPeriod = (typeof PLAN_PERIODS)[number];

/** A plan's amount in one currency (that currency's major unit, e.g. naira). */
export interface PlanCurrencyPrice {
  /** The amount charged once per billing period, in this currency. */
  price: number;
}

/**
 * Per-currency price overrides beyond the base (USD). Keyed by currency; USD
 * always lives in the plan's own `price`/`total`, never here. Deliberately set
 * amounts, not FX-derived — see `currencyForCountry`.
 */
export type PlanPriceOverrides = Partial<Record<CurrencyCode, PlanCurrencyPrice>>;

/**
 * Whether a plan is purchasable through a given provider.
 *
 * - `not_synced` — no provider price exists; checkout will reject the plan.
 * - `out_of_date` — a price exists, but the catalog's amount/interval has since
 *   changed. Checkout still works and **charges the old amount** — the dangerous
 *   state, because nothing else surfaces it.
 * - `synced` — the provider price matches the catalog.
 */
export const PLAN_SYNC_STATES = ['not_synced', 'out_of_date', 'synced'] as const;
export type PlanSyncState = (typeof PLAN_SYNC_STATES)[number];

/** A plan's sync state against one provider. Admin-only — never sent to learners. */
export interface PlanProviderSync {
  provider: ProviderKey;
  state: PlanSyncState;
  /** Amount the provider will actually charge, in minor units. Null when unsynced. */
  syncedAmountMinor: number | null;
  /** Amount the catalog says it should charge, in minor units. */
  expectedAmountMinor: number;
  currency: string | null;
  syncedAt: string | null;
  /**
   * The provider's product id, when synced. Most providers mint this
   * automatically; Apple IAP's is admin-entered (created manually in App Store
   * Connect), so the admin UI shows/edits it here.
   */
  providerProductId: string | null;
}

/** Sync state for every live provider, keyed by plan id. */
export type PlanProviderSyncMap = Record<string, PlanProviderSync[]>;

/** Outcome of syncing a plan to one provider (from the sync-to-all endpoint). */
export interface PlanSyncResult {
  provider: ProviderKey;
  /** `skipped` = the plan carries no price in this provider's currency. */
  status: 'synced' | 'failed' | 'skipped';
  /** Reason when `failed` or `skipped`, else null. */
  error: string | null;
}

export interface SubscriptionPlan {
  id: string;
  scope: PlanScope;
  name: string;
  /** The amount charged once per `period`, expressed in `currency`. */
  price: number;
  /**
   * The currency `price` is in for THIS payload. Admin payloads are always in
   * the base currency (USD); the public endpoint resolves the caller's local
   * currency and returns the amount in it.
   */
  currency: CurrencyCode;
  /** The billing period the plan charges on (drives the interval). */
  period: PlanPeriod;
  /**
   * Non-base currency price overrides (admin payloads only). Omitted from the
   * public/mobile payload, which is already resolved to a single currency.
   */
  prices?: PlanPriceOverrides;
  premium: boolean;
  /**
   * Feature keys this plan grants (see PLAN_FEATURES). Drives what subscribers
   * can access. May contain legacy free-text strings on plans created before
   * the catalog existed — render via `planFeatureLabel`.
   */
  features: PlanFeatureKey[];
  sortOrder: number;
}

/** One non-base currency override on a write (the amount charged per period). */
export interface PlanCurrencyPriceInput {
  currency: CurrencyCode;
  price: number;
}

export interface UpdateSubscriptionPlan {
  name?: string;
  /** Base-currency (USD) amount charged per period. */
  price?: number;
  period?: PlanPeriod;
  /** Full set of non-base currency prices; replaces the stored overrides. */
  prices?: PlanCurrencyPriceInput[];
  premium?: boolean;
  features?: PlanFeatureKey[];
}

export interface CreateSubscriptionPlan {
  scope: PlanScope;
  name: string;
  price: number;
  period?: PlanPeriod;
  prices?: PlanCurrencyPriceInput[];
  premium?: boolean;
  features?: PlanFeatureKey[];
}

/**
 * Where one plan sits relative to another, for upgrade/downgrade decisions.
 *
 * Rank, never price. A Yearly plan costs more up front than a Monthly one but
 * less per month, so comparing amounts would call the same move an upgrade or a
 * downgrade depending on which number you looked at — and differently again in
 * a currency whose overrides were set by hand. Instead: Family outranks
 * Individual (it is the strictly larger product), and within a scope a longer
 * commitment outranks a shorter one. That is the same "level" model Apple's
 * subscription groups use, which is what StoreKit actually applies on iOS
 * whatever we decide here, so the two can't disagree.
 */
const PLAN_SCOPE_RANK: Record<PlanScope, number> = { individual: 0, family: 1 };
const PLAN_PERIOD_RANK: Record<PlanPeriod, number> = { Month: 0, Quarter: 1, Year: 2 };

/** Comparable rank of a plan. Higher is the bigger product. */
export function planRank(plan: Pick<SubscriptionPlan, 'scope' | 'period'>): number {
  return (PLAN_SCOPE_RANK[plan.scope] ?? 0) * 10 + (PLAN_PERIOD_RANK[plan.period] ?? 0);
}

/** Which way a move between two plans goes. */
export const PLAN_CHANGE_DIRECTIONS = ['upgrade', 'downgrade', 'same'] as const;
export type PlanChangeDirection = (typeof PLAN_CHANGE_DIRECTIONS)[number];

/**
 * The direction of a move from `from` to `to`. `same` covers both "it's the
 * plan you're already on" and two plans that rank identically — neither is
 * worth charging or scheduling for.
 */
export function planChangeDirection(
  from: Pick<SubscriptionPlan, 'id' | 'scope' | 'period'>,
  to: Pick<SubscriptionPlan, 'id' | 'scope' | 'period'>,
): PlanChangeDirection {
  if (from.id === to.id) return 'same';
  const delta = planRank(to) - planRank(from);
  if (delta > 0) return 'upgrade';
  if (delta < 0) return 'downgrade';
  return 'same';
}
