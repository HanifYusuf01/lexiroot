export type AchievementKind = 'lessons_completed' | 'xp_total' | 'streak_days';

export type AchievementCode =
  | 'first_lesson'
  | 'ten_lessons'
  | 'fifty_lessons'
  | 'hundred_lessons'
  | 'xp_100'
  | 'xp_1000'
  | 'xp_10000'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'streak_120';

export interface Achievement {
  id: string;
  code: AchievementCode;
  title: string;
  description: string;
  iconKey: string;
  kind: AchievementKind;
  threshold: number;
  order: number;
}

export interface UserAchievement {
  id: string;
  achievement: Achievement;
  earnedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  country: string | null;
  xp: number;
  level: number;
  currentStreakDays: number;
}

export interface LeaderboardPage {
  items: LeaderboardEntry[];
  page: number;
  limit: number;
  total: number;
}

export interface XpDistributionBucket {
  label: string;
  min: number;
  max: number | null;
  users: number;
  percent: number;
}

export interface StreakOverview {
  longestStreakDays: number;
  avgStreakDays: number;
  avgStreakChangeThisMonth: number;
  sevenDayStreakUsers: number;
  thirtyDayStreakUsers: number;
}

export interface RecentBadge {
  code: AchievementCode;
  title: string;
  description: string;
  iconKey: string;
  earnedByUsers: number;
}

export interface GamificationStats {
  totalXpEarned: number;
  newXpThisMonth: number;
  activeStreaks: number;
  newStreaksThisMonth: number;
  badgesEarned: number;
  newBadgesThisMonth: number;
  usersParticipating: number;
  newParticipantsThisMonth: number;
  xpDistribution: XpDistributionBucket[];
  streakOverview: StreakOverview;
  recentBadges: RecentBadge[];
}

export interface TopXpEarner {
  rank: number;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
  currentStreakDays: number;
}

export interface TopXpEarnersPage {
  items: TopXpEarner[];
  page: number;
  limit: number;
  total: number;
}

// Linear level curve — 250 XP per level. Simple to reason about, and matches
// the rough rate a learner gains XP at one or two lessons per session.
export const XP_PER_LEVEL = 250;

export function levelFromXp(xp: number): number {
  if (!Number.isFinite(xp) || xp < 0) return 1;
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export interface AchievementSeed {
  code: AchievementCode;
  title: string;
  description: string;
  iconKey: string;
  kind: AchievementKind;
  threshold: number;
  order: number;
}

// Catalog awarded by the backend. Order drives the badge row in the profile.
export const ACHIEVEMENT_CATALOG: AchievementSeed[] = [
  { code: 'first_lesson',    title: 'First Steps',       description: 'Completed your first lesson',     iconKey: 'medal',     kind: 'lessons_completed', threshold: 1,     order: 10 },
  { code: 'ten_lessons',     title: 'Getting Started',   description: 'Completed 10 lessons',            iconKey: 'medal',     kind: 'lessons_completed', threshold: 10,    order: 20 },
  { code: 'fifty_lessons',   title: 'Half Century',      description: 'Completed 50 lessons',            iconKey: 'medal',     kind: 'lessons_completed', threshold: 50,    order: 30 },
  { code: 'hundred_lessons', title: 'Centurion',         description: 'Completed 100 lessons',           iconKey: 'medal',     kind: 'lessons_completed', threshold: 100,   order: 40 },
  { code: 'xp_100',          title: 'XP Starter',        description: 'Earned 100 XP',                   iconKey: 'star',      kind: 'xp_total',          threshold: 100,   order: 50 },
  { code: 'xp_1000',         title: 'XP Climber',        description: 'Earned 1,000 XP',                 iconKey: 'star',      kind: 'xp_total',          threshold: 1000,  order: 60 },
  { code: 'xp_10000',        title: 'XP Legend',         description: 'Earned 10,000 XP',                iconKey: 'star',      kind: 'xp_total',          threshold: 10000, order: 70 },
  { code: 'streak_3',        title: '3-Day Streak',      description: 'Practised 3 days in a row',       iconKey: 'flame',     kind: 'streak_days',       threshold: 3,     order: 80 },
  { code: 'streak_7',        title: 'Week Warrior',      description: 'Practised 7 days in a row',       iconKey: 'flame',     kind: 'streak_days',       threshold: 7,     order: 90 },
  { code: 'streak_30',       title: 'Monthly Master',    description: 'Practised 30 days in a row',      iconKey: 'flame',     kind: 'streak_days',       threshold: 30,    order: 100 },
  { code: 'streak_120',      title: 'Streak Sovereign',  description: 'Practised 120 days in a row',     iconKey: 'flame',     kind: 'streak_days',       threshold: 120,   order: 110 },
];

// Legacy / unused — keep types but they aren't backed by tables yet.
export interface XpLedgerEntry {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface Streak {
  userId: string;
  current: number;
  longest: number;
  lastActiveDate: string;
}
