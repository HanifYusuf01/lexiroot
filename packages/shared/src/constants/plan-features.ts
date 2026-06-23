/**
 * Catalog of features a subscription plan can grant. Plans store the `key`s of
 * the features they include (in `SubscriptionPlan.features`), so this list is
 * the single source of truth for:
 *  - the admin plan create/edit selector (what can be ticked on a plan), and
 *  - what a subscriber is entitled to in the apps (gating reads these keys).
 *
 * Keys are stable identifiers — never rename a key once plans reference it; add
 * a new one and migrate instead. `label`/`description` are display-only and
 * safe to edit. Keep keys aligned with capabilities that actually exist in the
 * apps (offline downloads, exercises, etc.).
 */
export const PLAN_FEATURES = [
  {
    key: 'unlimited_lessons',
    label: 'Unlimited lessons',
    description: 'Removes the free daily lesson limit.',
  },
  {
    key: 'offline_downloads',
    label: 'Offline downloads',
    description: 'Download levels to learn without a connection.',
  },
  {
    key: 'practice_exercises',
    label: 'Practice exercises',
    description: 'Access the Practice tab and extra exercise drills.',
  },
  {
    key: 'speech_practice',
    label: 'Speech practice',
    description: 'Pronunciation and speaking exercises using the microphone.',
  },
  {
    key: 'cultural_content',
    label: 'Cultural content',
    description: 'Root Nuggets and cultural stories in the Culture tab.',
  },
  {
    key: 'advanced_cultural_content',
    label: 'Advanced cultural content',
    description: 'Deeper, premium-only cultural lessons and stories.',
  },
  {
    key: 'leaderboard',
    label: 'Leaderboard',
    description: 'Compete with other learners on the XP leaderboard.',
  },
  {
    key: 'achievements',
    label: 'Achievements & badges',
    description: 'Earn and showcase achievement badges.',
  },
  {
    key: 'family_sharing',
    label: 'Family sharing',
    description: 'Share the plan across multiple family member accounts.',
  },
  {
    key: 'priority_support',
    label: 'Priority support',
    description: 'Faster responses from the support team.',
  },
] as const;

export type PlanFeatureKey = (typeof PLAN_FEATURES)[number]['key'];

/** All valid feature keys — used for validation and selection. */
export const PLAN_FEATURE_KEYS: readonly PlanFeatureKey[] = PLAN_FEATURES.map((f) => f.key);

const PLAN_FEATURE_LABELS: Record<string, string> = Object.fromEntries(
  PLAN_FEATURES.map((f) => [f.key, f.label]),
);

/**
 * Display label for a feature key. Falls back to the raw value so legacy plans
 * that stored free-text features (before the catalog existed) still render.
 */
export function planFeatureLabel(key: string): string {
  return PLAN_FEATURE_LABELS[key] ?? key;
}
