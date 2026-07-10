import type { PlanProviderSync } from '@lexiroot/shared';
import { usePlanProviderSyncQuery } from '../services/subscriptionsApi';

/**
 * A plan's sync state against every live provider (Stripe, Paystack, …).
 *
 * Every card calls this, but RTK Query dedupes the identical subscription into a
 * single request, so there's no need to hoist the fetch into the parent.
 *
 * Returns an empty array while loading, or when the plan is free (the API
 * reports no actionable provider state for a zero-amount plan).
 */
export function usePlanSync(planId: string): PlanProviderSync[] {
  const { data } = usePlanProviderSyncQuery();
  return data?.[planId] ?? [];
}
