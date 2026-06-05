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

/** A headline metric with its period-over-period change + sparkline series. */
export interface AnalyticsKpi {
  value: number;
  /** Signed % change vs the previous equal-length period. */
  changePercent: number;
  up: boolean;
  /** Per-day values across the selected range, for the card sparkline. */
  spark: number[];
}

/** One slice of the "lessons completed by category" donut. */
export interface AnalyticsCategorySlice {
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface AnalyticsCategoryBreakdown {
  total: number;
  items: AnalyticsCategorySlice[];
}

/** Free vs premium split. Premium is 0 until the payments module exists. */
export interface AnalyticsSubscriptionBreakdown {
  total: number;
  free: number;
  premium: number;
  freePercent: number;
  premiumPercent: number;
}

export interface AnalyticsRevenuePlan {
  plan: string;
  users: number;
  revenue: number;
}

/** Revenue is all-zero until the payments module exists; shape is final. */
export interface AnalyticsRevenue {
  totalRevenue: number;
  paidSubscriptionRevenue: number;
  spark: number[];
  plans: AnalyticsRevenuePlan[];
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

// ---------- Revenue / subscription detail page ----------

export interface RevenueOverTimePoint {
  label: string;
  revenue: number;
  mrr: number;
  renewals: number;
}

export interface SubscriptionGrowthPoint {
  label: string;
  newPremium: number;
  cancellations: number;
  renewals: number;
}

export interface UsersBySubscriptionPoint {
  label: string;
  free: number;
  premium: number;
}

export interface RevenueBreakdownCard {
  key: string;
  label: string;
  value: number;
  /** Secondary line, e.g. "6,241 Subscriptions" or "88.7% conversion rate". */
  subLabel: string;
  changePercent: number;
  up: boolean;
}

export interface PlanBreakdownRow {
  plan: string;
  users: number;
  percent: number;
}

export interface SubscriptionPlanBreakdown {
  totalPremium: number;
  totalPremiumPercent: number;
  rows: PlanBreakdownRow[];
}

export interface FunnelInsight {
  key: string;
  label: string;
  detail: string;
  value: string;
  tone: 'negative' | 'positive' | 'neutral';
}

export interface PaymentProviderStat {
  key: string;
  provider: string;
  revenue: number;
  transactions: number;
  successRate: number;
  failedPayments: number;
}

export type PaymentActivityType =
  | 'Upgrade'
  | 'Renewal'
  | 'Conversion'
  | 'Trial'
  | 'Cancellation';

export interface PaymentActivityItem {
  id: string;
  name: string;
  description: string;
  type: PaymentActivityType;
  at: string;
}

export interface AnalyticsRevenueDetail {
  range: AnalyticsRange;
  revenueOverTime: RevenueOverTimePoint[];
  revenueBreakdown: RevenueBreakdownCard[];
  usersBySubscription: UsersBySubscriptionPoint[];
  planBreakdown: SubscriptionPlanBreakdown;
  subscriptionGrowth: SubscriptionGrowthPoint[];
  funnel: AnalyticsFunnelStep[];
  funnelInsights: FunnelInsight[];
  paymentProviders: PaymentProviderStat[];
  recentPayments: PaymentActivityItem[];
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
  lessonsByCategory: AnalyticsCategoryBreakdown;
  topLanguages: AnalyticsTopLanguage[];
  progressByLevel: AnalyticsLevelProgress[];
  xpDistribution: XpDistributionBucket[];
  topLessons: AnalyticsTopLesson[];
  subscription: AnalyticsSubscriptionBreakdown;
  revenue: AnalyticsRevenue;
  funnel: AnalyticsFunnelStep[];
}
