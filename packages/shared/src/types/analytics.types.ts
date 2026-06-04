// Admin overview analytics payload — drives the dashboard cards/charts.
import type { XpDistributionBucket } from './gamification.types';

export interface AnalyticsDailyActivityPoint {
  date: string;
  label: string;
  active: number;
  newUsers: number;
}

export interface AnalyticsTopLanguage {
  language: string;
  code: string;
  percent: number;
  color: string;
}

export interface AnalyticsTopLesson {
  id: string;
  title: string;
  level: string;
  completions: number;
  progress: number;
  color: string;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  lessonsCompleted: number;
  xpEarned: number;
  dailyActivity: AnalyticsDailyActivityPoint[];
  topLanguages: AnalyticsTopLanguage[];
  topLessons: AnalyticsTopLesson[];
}

// ---------- Full analytics dashboard (admin Analytics page) ----------

/** A headline metric with its period-over-period change. */
export interface AnalyticsKpi {
  value: number;
  /** Signed % change vs the previous equal-length period. */
  changePercent: number;
  up: boolean;
}

/** Distinct active-user counts over rolling windows (UTC days). */
export interface AnalyticsActiveUsers {
  dau: number;
  wau: number;
  mau: number;
}

/** Completed vs in-progress learners per difficulty tier. */
export interface AnalyticsLevelProgress {
  tier: string;
  label: string;
  completed: number;
  inProgress: number;
}

/** One step of the activation funnel, with drop-off relative to the step above. */
export interface AnalyticsFunnelStep {
  key: string;
  label: string;
  users: number;
  /** % of the first (top) step. */
  percentOfTop: number;
  /** % lost from the previous step (0 for the first step). */
  dropFromPrev: number;
}

export interface AnalyticsRange {
  from: string;
  to: string;
  days: number;
}

export interface AnalyticsDashboard {
  range: AnalyticsRange;
  kpis: {
    activeUsers: AnalyticsKpi;
    lessonsCompleted: AnalyticsKpi;
    xpEarned: AnalyticsKpi;
    dailyStreaks: AnalyticsKpi;
  };
  activeUsers: AnalyticsActiveUsers;
  activeStreaks: number;
  dailyActivity: AnalyticsDailyActivityPoint[];
  topLanguages: AnalyticsTopLanguage[];
  progressByLevel: AnalyticsLevelProgress[];
  xpDistribution: XpDistributionBucket[];
  topLessons: AnalyticsTopLesson[];
  funnel: AnalyticsFunnelStep[];
}
