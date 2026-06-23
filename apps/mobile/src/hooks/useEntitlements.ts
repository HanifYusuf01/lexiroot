import { useMemo } from 'react';
import type { PlanFeatureKey } from '@lexiroot/shared';
import { useAppSelector } from '../store/hooks';
import { FREE_FEATURES } from '../constants/entitlements';

/**
 * The feature keys the current user is entitled to. Reads the active plan's
 * features off the auth user when present, otherwise falls back to the free-tier
 * baseline. This is the single place gating reads from — see useHasFeature.
 */
export function useEntitlements(): PlanFeatureKey[] {
  const features = useAppSelector((s) => s.auth.user?.features);
  return useMemo(() => features ?? [...FREE_FEATURES], [features]);
}

/** Whether the current user's plan grants a specific feature. */
export function useHasFeature(feature: PlanFeatureKey): boolean {
  const entitlements = useEntitlements();
  return entitlements.includes(feature);
}
