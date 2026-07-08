import type { PlanFeatureKey } from '../constants/plan-features';
import type { ProviderKey } from './subscription.types';

export const PLAN_SCOPES = ['individual', 'family'] as const;
export type PlanScope = (typeof PLAN_SCOPES)[number];

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

export interface SubscriptionPlan {
  id: string;
  scope: PlanScope;
  name: string;
  /** Headline price for the billing period. */
  price: number;
  /** Period label shown after the price, e.g. "Month". */
  period: string;
  /** Total billed for the period when it differs from `price` (e.g. yearly). */
  total: number | null;
  premium: boolean;
  /**
   * Feature keys this plan grants (see PLAN_FEATURES). Drives what subscribers
   * can access. May contain legacy free-text strings on plans created before
   * the catalog existed — render via `planFeatureLabel`.
   */
  features: PlanFeatureKey[];
  sortOrder: number;
}

export interface UpdateSubscriptionPlan {
  name?: string;
  price?: number;
  period?: string;
  total?: number | null;
  premium?: boolean;
  features?: PlanFeatureKey[];
}

export interface CreateSubscriptionPlan {
  scope: PlanScope;
  name: string;
  price: number;
  period?: string;
  total?: number | null;
  premium?: boolean;
  features?: PlanFeatureKey[];
}
