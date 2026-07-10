import type { CurrencyCode } from '../constants';
import type { PlanFeatureKey } from '../constants/plan-features';
import type { ProviderKey } from './subscription.types';

export const PLAN_SCOPES = ['individual', 'family'] as const;
export type PlanScope = (typeof PLAN_SCOPES)[number];

/** A plan's amount in one currency (that currency's major unit, e.g. naira). */
export interface PlanCurrencyPrice {
  /** Headline price for the billing period. */
  price: number;
  /** Total billed for the period when it differs from `price` (e.g. yearly). */
  total: number | null;
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
  /** Headline price, expressed in `currency`. */
  price: number;
  /**
   * The currency `price`/`total` are in for THIS payload. Admin payloads are
   * always in the base currency (USD); the public endpoint resolves the caller's
   * local currency and returns the amounts in it.
   */
  currency: CurrencyCode;
  /** Period label shown after the price, e.g. "Month". */
  period: string;
  /** Total billed for the period when it differs from `price` (e.g. yearly). */
  total: number | null;
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

/** One non-base currency override on a write. `total: null` → same as `price`. */
export interface PlanCurrencyPriceInput {
  currency: CurrencyCode;
  price: number;
  total?: number | null;
}

export interface UpdateSubscriptionPlan {
  name?: string;
  /** Base-currency (USD) headline price. */
  price?: number;
  period?: string;
  /** Base-currency (USD) billed total. */
  total?: number | null;
  /** Full set of non-base currency prices; replaces the stored overrides. */
  prices?: PlanCurrencyPriceInput[];
  premium?: boolean;
  features?: PlanFeatureKey[];
}

export interface CreateSubscriptionPlan {
  scope: PlanScope;
  name: string;
  price: number;
  period?: string;
  total?: number | null;
  prices?: PlanCurrencyPriceInput[];
  premium?: boolean;
  features?: PlanFeatureKey[];
}
