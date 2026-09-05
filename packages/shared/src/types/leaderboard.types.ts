/**
 * Weekly leaderboard, Root Points and leagues.
 *
 * Root Points (RP) are the same currency as the XP ledger has always recorded —
 * the rename is presentational, so history carries over rather than starting
 * from zero. The leaderboard reads *this week's* RP; `users.xp` remains the
 * lifetime total that drives levels and achievements.
 *
 * Every number here is computed server-side. The app never says "I earned 50" —
 * it reports what happened and the API decides what that was worth, which is
 * what keeps the scoring configurable and the ranking honest.
 */

import type { LanguageCode, LearningLevel } from '../constants';

/** Leagues, lowest to highest. A learner sits in exactly one. */
export const LEAGUES = ['bronze', 'silver', 'gold', 'platinum'] as const;
export type League = (typeof LEAGUES)[number];

export const LEAGUE_LABELS: Record<League, string> = {
  bronze: 'Bronze League',
  silver: 'Silver League',
  gold: 'Gold League',
  platinum: 'Platinum League',
};

/**
 * Activities that can earn RP. Stored as the ledger's `reason`, so adding one
 * is a code change but its *value* is admin-configurable — the point of
 * `RootPointRates`.
 */
export const RP_ACTIVITIES = [
  'lesson_completion',
  'lesson_review',
  'vocabulary_practice',
  'listening_exercise',
  'speaking_exercise',
  'recognition_exercise',
  'unit_completion',
  'streak_milestone',
  'admin_adjustment',
] as const;
export type RpActivity = (typeof RP_ACTIVITIES)[number];

export const RP_ACTIVITY_LABELS: Record<RpActivity, string> = {
  lesson_completion: 'Complete lesson',
  lesson_review: 'Review lesson',
  vocabulary_practice: 'Vocabulary practice',
  listening_exercise: 'Listening exercise',
  speaking_exercise: 'Speaking exercise',
  recognition_exercise: 'Recognition exercise',
  unit_completion: 'Complete unit',
  streak_milestone: 'Streak milestone',
  admin_adjustment: 'Manual adjustment',
};

/**
 * RP awarded per activity. Admin-editable; missing keys fall back to the
 * defaults below.
 *
 * `lesson_completion` is the *fallback* for a lesson with no `xpReward` of its
 * own — a lesson that carries one is worth that instead, so authors keep
 * control of individual lessons. Repeats of a lesson are priced by
 * `DEFAULT_RP_REPEAT_MULTIPLIERS` against the same base rather than by the
 * `lesson_review` rate, which is reserved for standalone review activities.
 */
export type RootPointRates = Partial<Record<RpActivity, number>>;

export const DEFAULT_RP_RATES: Record<RpActivity, number> = {
  lesson_completion: 50,
  lesson_review: 20,
  vocabulary_practice: 10,
  listening_exercise: 15,
  speaking_exercise: 20,
  recognition_exercise: 15,
  unit_completion: 100,
  streak_milestone: 30,
  admin_adjustment: 0,
};

/**
 * What a repeat of the same lesson is worth, as a fraction of full RP, indexed
 * by how many times it has already been completed.
 *
 * This is the anti-farming rule: the first pass earns full value, the first
 * review a fraction, later reviews progressively less, and beyond the end of
 * the list nothing at all. Reviewing is worth encouraging — grinding the same
 * easy lesson for rank is not.
 */
export const DEFAULT_RP_REPEAT_MULTIPLIERS = [1, 0.4, 0.2, 0.1, 0] as const;

/** Where a league's boundaries sit at the weekly rollover. */
export interface LeagueConfig {
  /** Top N of a league are promoted. */
  promoteTop: number;
  /** Bottom N are demoted (never out of Bronze). */
  demoteBottom: number;
  /** RP a learner must earn in the week to be ranked at all. */
  minWeeklyRp: number;
}

export const DEFAULT_LEAGUE_CONFIG: LeagueConfig = {
  promoteTop: 5,
  demoteBottom: 5,
  minWeeklyRp: 1,
};

/** One row of the ranking list. */
export interface LeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rootPoints: number;
  currentStreakDays: number;
  /** True for the row belonging to the caller, so the app can highlight it. */
  isMe: boolean;
}

/** The caller's own standing, kept visible even when far outside the top. */
export interface LeaderboardMe {
  /** Null when they have earned no RP this week, or opted out. */
  rank: number | null;
  previousRank: number | null;
  /** Places gained (positive) or lost (negative) since last week. */
  rankDelta: number | null;
  rootPoints: number;
  lessonsCompleted: number;
  /** Percentage of answers correct across the week's completions, 0–100. */
  masteryScore: number;
  currentStreakDays: number;
  league: League;
  /** RP total of the next milestone, and how far away it is. */
  nextMilestone: number | null;
  rpToNextMilestone: number | null;
  optedOut: boolean;
}

/** The weekly competition window, and how long is left in it. */
export interface LeaderboardPeriod {
  /** ISO 8601 date (Monday, UTC). */
  startsOn: string;
  /** ISO 8601 date (Sunday, UTC). */
  endsOn: string;
  /** ISO week number, for the "Week 20" header. */
  weekNumber: number;
  /** Milliseconds until the reset, so the client can run a countdown. */
  resetsInMs: number;
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod;
  league: League;
  language: LanguageCode | null;
  level: LearningLevel | null;
  rows: LeaderboardRow[];
  me: LeaderboardMe;
}

/**
 * The family board. Same shape as the public one minus the filters — everyone
 * on the plan is ranked together whatever they're learning, because the point
 * is the household, not the language.
 */
export interface FamilyLeaderboardResponse {
  period: LeaderboardPeriod;
  /** False when the caller isn't on a family plan; `rows` is then empty. */
  enabled: boolean;
  rows: LeaderboardRow[];
}

/** Query for the public board. All optional — omitted filters use the caller's own. */
export interface LeaderboardQuery {
  language?: LanguageCode;
  level?: LearningLevel;
  league?: League;
  limit?: number;
}

/** How long a friend invitation stays open. */
export const FRIEND_INVITE_TTL_DAYS = 7;

export type FriendStatus = 'friend' | 'pending' | 'incoming';

/** Someone on the caller's friends list, or an invitation either way. */
export interface FriendSummary {
  /** Invitation id for a pending/incoming row; user id for an accepted friend. */
  id: string;
  status: FriendStatus;
  /** Null until an invitation is accepted (they may not have an account yet). */
  userId: string | null;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface FriendsOverview {
  friends: FriendSummary[];
  /** Invitations the caller sent that nobody has accepted yet. */
  pending: FriendSummary[];
  /** Invitations sent *to* the caller, awaiting their answer. */
  incoming: FriendSummary[];
}

export interface FriendInvitePreview {
  email: string;
  invitedByName: string | null;
  expiresAt: string;
}

/**
 * The friends board. Like the family one, everybody is ranked together —
 * no league, language or level split, because you picked these people
 * yourself and splitting them defeats the point.
 */
export interface FriendsLeaderboardResponse {
  period: LeaderboardPeriod;
  /** False when the caller has no friends yet; `rows` is then empty. */
  enabled: boolean;
  rows: LeaderboardRow[];
}
