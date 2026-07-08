import type { PlanProviderSync } from '@lexiroot/shared';
import { usePlanProviderSyncQuery } from '../services/subscriptionsApi';

/**
 * A plan's sync state against the default (first live) provider — Stripe today.
 *
 * Every card calls this, but RTK Query dedupes the identical subscription into a
 * single request, so there's no need to hoist the fetch into the parent.
 *
 * Returns `null` while loading, or when the plan is free (the API reports no
 * actionable provider state for a zero-amount plan).
 */
export function usePlanSync(planId: string): PlanProviderSync | null {
  const { data } = usePlanProviderSyncQuery();
  return data?.[planId]?.[0] ?? null;
}
