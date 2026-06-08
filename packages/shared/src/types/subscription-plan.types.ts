export const PLAN_SCOPES = ['individual', 'family'] as const;
export type PlanScope = (typeof PLAN_SCOPES)[number];

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
  features: string[];
  sortOrder: number;
}

export interface UpdateSubscriptionPlan {
  name?: string;
  price?: number;
  period?: string;
  total?: number | null;
  premium?: boolean;
  features?: string[];
}
