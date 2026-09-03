import type { PlanFeatureKey } from '@lexiroot/shared';

/**
 * Feature keys every learner gets without a paid plan. Used as the entitlement
 * fallback until the backend returns the user's actual plan features on
 * `/auth/me`. Anything NOT in this list is effectively premium-gated today.
 *
 * Keep this aligned with the admin "Free" plan: the source of truth for a paying
 * user is their plan's `features`; this is only the no-subscription baseline.
 */
export const FREE_FEATURES: readonly PlanFeatureKey[] = [
  'practice_exercises',
  'speech_practice',
  'cultural_content',
  'leaderboard',
  'achievements',
];

/**
 * The single level a learner can access without an `unlimited_lessons` plan.
 * Re-exported rather than redeclared: the API enforces the same number, and a
 * local copy that drifted would put the padlock and the 403 in different places.
 */
export { FREE_ACCESS_LEVEL } from '@lexiroot/shared';
