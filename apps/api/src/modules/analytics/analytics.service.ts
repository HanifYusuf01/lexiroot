import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LEARNING_LEVELS,
  LEARNING_LEVEL_LABELS,
  LESSON_TYPES,
  LESSON_TYPE_LABELS,
  type AnalyticsActiveUsers,
  type AnalyticsCategoryBreakdown,
  type AnalyticsDailyActivityPoint,
  type AnalyticsDashboard,
  type AnalyticsFunnelStep,
  type AnalyticsKpi,
  type AnalyticsLevelProgress,
  type AnalyticsOverview,
  type AnalyticsRevenue,
  type AnalyticsRevenueDetail,
  type AnalyticsSubscriptionBreakdown,
  type FunnelInsight,
  type PaymentProviderStat,
  type RevenueBreakdownCard,
  type RevenueOverTimePoint,
  type SubscriptionGrowthPoint,
  type SubscriptionPlanBreakdown,
  type UsersBySubscriptionPoint,
  type AnalyticsTopLanguage,
  type AnalyticsTopLesson,
  type LanguageCode,
  type LearningLevel,
  type LessonType,
  type XpDistributionBucket,
} from '@lexiroot/shared';
import { XpLedgerEntry } from '../gamification/entities/xp-ledger-entry.entity';
import { Language } from '../languages/entities/language.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { User } from '../users/entities/user.entity';
import { LessonCompletion } from '../progress/entities/lesson-completion.entity';
import { LessonProgress } from '../progress/entities/lesson-progress.entity';
import { UserActiveDay } from './entities/user-active-day.entity';

const ACTIVITY_WINDOW_DAYS = 7;

// Brand colors used for the language donut + lesson progress bars.
const LANGUAGE_COLORS: Record<LanguageCode, string> = {
  yo: '#E35336',
  ig: '#1FC0E0',
  ha: '#F9D506',
};

// Used for languages added beyond the original seed set, which have no brand colour.
const LANGUAGE_FALLBACK_COLORS = ['#814231', '#BF9828', '#16A34A', '#7A7878', '#9333EA', '#0EA5E9'];
const LESSON_COLORS = ['#16A34A', '#E35336', '#F9D506', '#1FC0E0', '#814231'];

// Donut palette for "lessons completed by category".
const CATEGORY_COLORS = ['#E35336', '#1FC0E0', '#F9D506', '#16A34A', '#814231', '#7B61FF'];

// XP buckets — kept in sync with the gamification dashboard so the same
// distribution reads identically across both admin pages.
const XP_BUCKETS: { label: string; min: number; max: number | null }[] = [
  { label: '0 - 500 XP', min: 0, max: 500 },
  { label: '501 - 1500 XP', min: 501, max: 1500 },
  { label: '1,501 - 3000 XP', min: 1501, max: 3000 },
  { label: '3001 - 5000 XP', min: 3001, max: 5000 },
  { label: '5,001+ XP', min: 5001, max: null },
];

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDayUtc(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(`${s.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDaysUtc(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

// Period-over-period delta. Treats a zero baseline as +100% when the current
// value is positive so the card still reads as growth rather than dividing by 0.
function pctChange(curr: number, prev: number): { changePercent: number; up: boolean } {
  if (prev <= 0) {
    return { changePercent: curr > 0 ? 100 : 0, up: curr >= prev };
  }
  const change = ((curr - prev) / prev) * 100;
  return { changePercent: Math.round(change * 10) / 10, up: change >= 0 };
}

interface LangRow {
  language: string | null;
  count: string;
}

interface LessonRow {
  id: string;
  title: string;
  tier: string;
  completions: string;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function shortLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Lesson) private readonly lessons: Repository<Lesson>,
    @InjectRepository(LessonCompletion)
    private readonly completions: Repository<LessonCompletion>,
    @InjectRepository(LessonProgress)
    private readonly progress: Repository<LessonProgress>,
    @InjectRepository(XpLedgerEntry)
    private readonly xpLedger: Repository<XpLedgerEntry>,
    @InjectRepository(UserActiveDay)
    private readonly activeDays: Repository<UserActiveDay>,
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
  ) {}

  async overview(fromStr?: string, toStr?: string): Promise<AnalyticsOverview> {
    const today = daysAgo(0);
    const to = parseDayUtc(toStr) ?? today;
    let from = parseDayUtc(fromStr) ?? addDaysUtc(to, -(ACTIVITY_WINDOW_DAYS - 1));
    if (from > to) from = addDaysUtc(to, -(ACTIVITY_WINDOW_DAYS - 1));
    const toEndExcl = addDaysUtc(to, 1);

    const [
      totalUsers,
      activeUsers,
      lessonsCompleted,
      xpEarned,
      dailyActivity,
      topLanguages,
      topLessons,
    ] = await Promise.all([
      // "Total users" stays a running total — everyone registered by the end of
      // the selected window.
      this.countUsersAsOf(toEndExcl),
      this.distinctActiveUsers(from, to),
      this.countCompletionsBetween(from, toEndExcl),
      this.sumXpBetween(from, toEndExcl),
      this.dailyActivityBetween(from, to),
      // Top languages / lessons are all-time distribution cards, not time-series.
      this.topLanguages(),
      this.topLessons(),
    ]);

    return {
      totalUsers,
      activeUsers,
      lessonsCompleted,
      xpEarned,
      dailyActivity,
      topLanguages,
      topLessons,
    };
  }

  private async countUsersAsOf(endExcl: Date): Promise<number> {
    return this.users
      .createQueryBuilder('user')
      .where('user.created_at < :end', { end: endExcl })
      .getCount();
  }

  private async topLanguages(): Promise<AnalyticsTopLanguage[]> {
    // The teaching-languages catalog (admin Settings) is the source of truth for
    // which languages exist; usage counts come from users.language.
    const [catalog, rows] = await Promise.all([
      this.languages.find({ order: { createdAt: 'ASC' } }),
      this.users
        .createQueryBuilder('user')
        .select('user.language', 'language')
        .addSelect('COUNT(*)', 'count')
        .where('user.language IS NOT NULL')
        .groupBy('user.language')
        .getRawMany<LangRow>(),
    ]);

    const counts = new Map<string, number>();
    let total = 0;
    for (const r of rows) {
      if (!r.language) continue;
      const n = Number(r.count);
      counts.set(r.language, n);
      total += n;
    }

    const out: AnalyticsTopLanguage[] = catalog.map((lang, index) => {
      const n = counts.get(lang.code) ?? 0;
      return {
        language: lang.name,
        code: lang.code as LanguageCode,
        percent: total > 0 ? Math.round((n / total) * 100) : 0,
        color: LANGUAGE_COLORS[lang.code as LanguageCode] ?? LANGUAGE_FALLBACK_COLORS[index % LANGUAGE_FALLBACK_COLORS.length],
      };
    });

    out.sort((a, b) => b.percent - a.percent);
    return out;
  }

  private async topLessons(limit = 4): Promise<AnalyticsTopLesson[]> {
    const rows: LessonRow[] = await this.lessons
      .createQueryBuilder('lesson')
      .leftJoin('lesson_completions', 'completion', 'completion.lesson_id = lesson.id')
      .select('lesson.id', 'id')
      .addSelect('lesson.title', 'title')
      .addSelect('lesson.tier', 'tier')
      .addSelect('COUNT(completion.id)', 'completions')
      .where('lesson.status = :status', { status: 'published' })
      .groupBy('lesson.id')
      .orderBy('completions', 'DESC')
      .limit(limit)
      .getRawMany();

    const totalUsers = await this.users.count();
    return rows.map((r, i) => {
      const completions = Number(r.completions);
      const progress = totalUsers > 0 ? Math.round((completions / totalUsers) * 100) : 0;
      return {
        id: r.id,
        title: r.title,
        level: r.tier.charAt(0).toUpperCase() + r.tier.slice(1),
        completions,
        progress: Math.min(progress, 100),
        color: LESSON_COLORS[i % LESSON_COLORS.length],
      };
    });
  }

  // ---------- Full dashboard (admin Analytics page) ----------

  async dashboard(fromStr?: string, toStr?: string): Promise<AnalyticsDashboard> {
    const today = daysAgo(0);
    const to = parseDayUtc(toStr) ?? today;
    let from = parseDayUtc(fromStr) ?? addDaysUtc(to, -6);
    if (from > to) from = addDaysUtc(to, -6);

    const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
    // Previous equal-length window, immediately before [from, to].
    const prevTo = addDaysUtc(from, -1);
    const prevFrom = addDaysUtc(prevTo, -(days - 1));

    const fromStart = from;
    const toEndExcl = addDaysUtc(to, 1);
    const prevFromStart = prevFrom;
    const prevToEndExcl = addDaysUtc(prevTo, 1);

    const [
      activeCurr,
      activePrev,
      lessonsCurr,
      lessonsPrev,
      xpCurr,
      xpPrev,
      activeStreaks,
      dau,
      wau,
      mau,
      dailyActivity,
      completionsSpark,
      xpSpark,
      lessonsByCategory,
      topLanguages,
      progressByLevel,
      xpDistribution,
      topLessons,
      subscription,
      revenue,
      funnel,
    ] = await Promise.all([
      this.distinctActiveUsers(from, to),
      this.distinctActiveUsers(prevFrom, prevTo),
      this.countCompletionsBetween(fromStart, toEndExcl),
      this.countCompletionsBetween(prevFromStart, prevToEndExcl),
      this.sumXpBetween(fromStart, toEndExcl),
      this.sumXpBetween(prevFromStart, prevToEndExcl),
      this.countActiveStreaks(),
      this.distinctActiveUsers(today, today),
      this.distinctActiveUsers(addDaysUtc(today, -6), today),
      this.distinctActiveUsers(addDaysUtc(today, -29), today),
      this.dailyActivityBetween(from, to),
      this.dailyCompletionsBetween(from, to),
      this.dailyXpBetween(from, to),
      this.lessonsByCategory(),
      this.topLanguages(),
      this.progressByLevel(),
      this.xpDistribution(),
      this.topLessons(6),
      this.subscriptionBreakdown(),
      this.revenue(days),
      this.funnel(),
    ]);

    const activeSpark = dailyActivity.map((p) => p.active);

    const dashboardKpis: AnalyticsDashboard['kpis'] = {
      activeUsers: { value: activeCurr, ...pctChange(activeCurr, activePrev), spark: activeSpark },
      lessonsCompleted: {
        value: lessonsCurr,
        ...pctChange(lessonsCurr, lessonsPrev),
        spark: completionsSpark,
      },
      xpEarned: { value: xpCurr, ...pctChange(xpCurr, xpPrev), spark: xpSpark },
      // Streaks aren't stored historically, so the headline is the current
      // active-streak count and the trend mirrors active-user growth (the
      // engagement that keeps streaks alive).
      dailyStreaks: {
        value: activeStreaks,
        ...pctChange(activeCurr, activePrev),
        spark: activeSpark,
      },
    };

    const activeUsers: AnalyticsActiveUsers = { dau, wau, mau };

    return {
      range: { from: ymd(from), to: ymd(to), days },
      kpis: dashboardKpis,
      activeUsers,
      activeStreaks,
      dailyActivity,
      lessonsByCategory,
      topLanguages,
      progressByLevel,
      xpDistribution,
      topLessons,
      subscription,
      revenue,
      funnel,
    };
  }

  /** Per-day completion counts aligned to [from, to] (for KPI sparklines). */
  private async dailyCompletionsBetween(from: Date, to: Date): Promise<number[]> {
    const rows: { day: string; c: string }[] = await this.completions
      .createQueryBuilder('c')
      .select(`to_char(date_trunc('day', c.completed_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`, 'day')
      .addSelect('COUNT(*)', 'c')
      .where('c.completed_at >= :start AND c.completed_at < :end', {
        start: from,
        end: addDaysUtc(to, 1),
      })
      .groupBy('day')
      .getRawMany();
    return this.alignDaily(rows, from, to);
  }

  /** Per-day XP totals aligned to [from, to] (for KPI sparklines). */
  private async dailyXpBetween(from: Date, to: Date): Promise<number[]> {
    const rows: { day: string; c: string }[] = await this.xpLedger
      .createQueryBuilder('x')
      .select(`to_char(date_trunc('day', x.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`, 'day')
      .addSelect('COALESCE(SUM(x.amount), 0)', 'c')
      .where('x.created_at >= :start AND x.created_at < :end', {
        start: from,
        end: addDaysUtc(to, 1),
      })
      .groupBy('day')
      .getRawMany();
    return this.alignDaily(rows, from, to);
  }

  private alignDaily(rows: { day: string; c: string }[], from: Date, to: Date): number[] {
    const map = new Map(rows.map((r) => [r.day, Number(r.c)]));
    const out: number[] = [];
    for (let cur = new Date(from); cur <= to; cur = addDaysUtc(cur, 1)) {
      out.push(map.get(ymd(cur)) ?? 0);
    }
    return out;
  }

  private async lessonsByCategory(): Promise<AnalyticsCategoryBreakdown> {
    const rows: { type: string; c: string }[] = await this.completions
      .createQueryBuilder('c')
      .innerJoin('lessons', 'l', 'l.id = c.lesson_id')
      .select('l.type', 'type')
      .addSelect('COUNT(*)', 'c')
      .groupBy('l.type')
      .getRawMany();

    const counts = new Map(rows.map((r) => [r.type, Number(r.c)]));
    const total = rows.reduce((sum, r) => sum + Number(r.c), 0);
    const denom = Math.max(1, total);

    const items = (LESSON_TYPES as readonly LessonType[])
      .map((type, i) => {
        const count = counts.get(type) ?? 0;
        return {
          label: LESSON_TYPE_LABELS[type],
          count,
          percent: Math.round((count / denom) * 100),
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        };
      })
      .sort((a, b) => b.count - a.count);

    return { total, items };
  }

  private async subscriptionBreakdown(): Promise<AnalyticsSubscriptionBreakdown> {
    // No payments module yet — every user is on the free tier. When premium
    // subscriptions land, source `premium` from the subscriptions table.
    const total = await this.users.createQueryBuilder('user').where("user.role != 'admin'").getCount();
    const premium = 0;
    const free = total - premium;
    const denom = Math.max(1, total);
    return {
      total,
      free,
      premium,
      freePercent: Math.round((free / denom) * 100),
      premiumPercent: Math.round((premium / denom) * 100),
    };
  }

  private revenue(days: number): AnalyticsRevenue {
    // Placeholder zeros until the payments module exists; the shape is final
    // so the dashboard cards render correctly today and just light up later.
    return {
      totalRevenue: 0,
      paidSubscriptionRevenue: 0,
      spark: Array.from({ length: days }, () => 0),
      plans: [
        { plan: 'Monthly Plan', users: 0, revenue: 0 },
        { plan: 'Quarterly Plan', users: 0, revenue: 0 },
        { plan: 'Annual Plan', users: 0, revenue: 0 },
      ],
    };
  }

  private async distinctActiveUsers(from: Date, to: Date): Promise<number> {
    const row = await this.activeDays
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.user_id)', 'c')
      .where('a.day BETWEEN :from AND :to', { from: ymd(from), to: ymd(to) })
      .getRawOne<{ c: string }>();
    return Number(row?.c ?? 0);
  }

  private async countCompletionsBetween(start: Date, endExcl: Date): Promise<number> {
    return this.completions
      .createQueryBuilder('c')
      .where('c.completed_at >= :start AND c.completed_at < :end', { start, end: endExcl })
      .getCount();
  }

  private async sumXpBetween(start: Date, endExcl: Date): Promise<number> {
    const row = await this.xpLedger
      .createQueryBuilder('x')
      .select('COALESCE(SUM(x.amount), 0)', 'sum')
      .where('x.created_at >= :start AND x.created_at < :end', { start, end: endExcl })
      .getRawOne<{ sum: string }>();
    return Number(row?.sum ?? 0);
  }

  private async countActiveStreaks(): Promise<number> {
    return this.users
      .createQueryBuilder('user')
      .where('user.current_streak_days > 0')
      .getCount();
  }

  private async dailyActivityBetween(from: Date, to: Date): Promise<AnalyticsDailyActivityPoint[]> {
    const active: { day: string; active: string }[] = await this.activeDays
      .createQueryBuilder('a')
      .select(`to_char(a.day, 'YYYY-MM-DD')`, 'day')
      .addSelect('COUNT(DISTINCT a.user_id)', 'active')
      .where('a.day BETWEEN :from AND :to', { from: ymd(from), to: ymd(to) })
      .groupBy('a.day')
      .getRawMany();

    const created: { day: string; new_users: string }[] = await this.users
      .createQueryBuilder('user')
      .select(`to_char(date_trunc('day', user.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`, 'day')
      .addSelect('COUNT(*)', 'new_users')
      .where('user.created_at >= :start AND user.created_at < :end', {
        start: from,
        end: addDaysUtc(to, 1),
      })
      .groupBy('day')
      .getRawMany();

    const map = new Map<string, { active: number; newUsers: number }>();
    for (const row of active) {
      const e = map.get(row.day) ?? { active: 0, newUsers: 0 };
      e.active = Number(row.active);
      map.set(row.day, e);
    }
    for (const row of created) {
      const e = map.get(row.day) ?? { active: 0, newUsers: 0 };
      e.newUsers = Number(row.new_users);
      map.set(row.day, e);
    }

    const points: AnalyticsDailyActivityPoint[] = [];
    for (let cur = new Date(from); cur <= to; cur = addDaysUtc(cur, 1)) {
      const key = ymd(cur);
      const e = map.get(key) ?? { active: 0, newUsers: 0 };
      points.push({ date: key, label: shortLabel(cur), active: e.active, newUsers: e.newUsers });
    }
    return points;
  }

  private async progressByLevel(): Promise<AnalyticsLevelProgress[]> {
    const completedRows: { tier: string; c: string }[] = await this.completions
      .createQueryBuilder('c')
      .innerJoin('lessons', 'l', 'l.id = c.lesson_id')
      .select('l.tier', 'tier')
      .addSelect('COUNT(*)', 'c')
      .groupBy('l.tier')
      .getRawMany();

    const inProgressRows: { tier: string; c: string }[] = await this.progress
      .createQueryBuilder('p')
      .select('p.tier', 'tier')
      .addSelect('COUNT(*)', 'c')
      .groupBy('p.tier')
      .getRawMany();

    const completedMap = new Map(completedRows.map((r) => [r.tier, Number(r.c)]));
    const inProgressMap = new Map(inProgressRows.map((r) => [r.tier, Number(r.c)]));

    return (LEARNING_LEVELS as readonly LearningLevel[]).map((tier) => ({
      tier,
      label: LEARNING_LEVEL_LABELS[tier],
      completed: completedMap.get(tier) ?? 0,
      inProgress: inProgressMap.get(tier) ?? 0,
    }));
  }

  private async xpDistribution(): Promise<XpDistributionBucket[]> {
    const caseSql = XP_BUCKETS.map((b, i) =>
      b.max != null
        ? `WHEN u.xp BETWEEN ${b.min} AND ${b.max} THEN ${i}`
        : `WHEN u.xp >= ${b.min} THEN ${i}`,
    ).join(' ');
    const rows = await this.users.manager.query<{ idx: number; count: string }[]>(
      `SELECT CASE ${caseSql} ELSE -1 END AS idx, COUNT(*)::text AS count
         FROM users u
        WHERE u.xp >= 0
        GROUP BY 1`,
    );
    const byIdx = new Map(rows.map((r) => [Number(r.idx), Number(r.count)]));

    const participants = await this.users
      .createQueryBuilder('user')
      .where('user.xp > 0')
      .getCount();
    const denom = Math.max(1, participants);

    return XP_BUCKETS.map((b, i) => {
      const users = byIdx.get(i) ?? 0;
      return {
        label: b.label,
        min: b.min,
        max: b.max,
        users,
        percent: Math.round((users / denom) * 100),
      };
    });
  }

  // Activation funnel derived entirely from current state — no event pipeline.
  // Subscription/paywall steps are intentionally omitted until the payments
  // module exists; this covers signup → first real learning.
  private async funnel(): Promise<AnalyticsFunnelStep[]> {
    const [signedUp, onboarded, startedLesson, completedLesson, earnedXp] = await Promise.all([
      this.users.count(),
      this.users
        .createQueryBuilder('user')
        .where('user.language IS NOT NULL AND user.level IS NOT NULL')
        .getCount(),
      this.progress
        .createQueryBuilder('p')
        .select('COUNT(DISTINCT p.user_id)', 'c')
        .getRawOne<{ c: string }>()
        .then((r) => Number(r?.c ?? 0)),
      this.completions
        .createQueryBuilder('c')
        .select('COUNT(DISTINCT c.user_id)', 'c')
        .getRawOne<{ c: string }>()
        .then((r) => Number(r?.c ?? 0)),
      this.users.createQueryBuilder('user').where('user.xp > 0').getCount(),
    ]);

    const raw: { key: string; label: string; users: number }[] = [
      { key: 'signed_up', label: 'Signed up', users: signedUp },
      { key: 'onboarded', label: 'Completed onboarding', users: onboarded },
      { key: 'started_lesson', label: 'Started a lesson', users: startedLesson },
      { key: 'completed_lesson', label: 'Completed a lesson', users: completedLesson },
      { key: 'earned_xp', label: 'Earned XP', users: earnedXp },
    ];

    const top = raw[0]?.users ?? 0;
    return raw.map((step, i) => {
      const prev = i > 0 ? raw[i - 1].users : step.users;
      const percentOfTop = top > 0 ? Math.round((step.users / top) * 1000) / 10 : 0;
      const dropFromPrev =
        i === 0 || prev <= 0 ? 0 : Math.round(((prev - step.users) / prev) * 1000) / 10;
      return { key: step.key, label: step.label, users: step.users, percentOfTop, dropFromPrev };
    });
  }

  // ---------- Revenue / subscription detail page ----------
  //
  // Revenue, MRR, renewals, provider stats and the payment feed are all zero /
  // empty until the payments module lands — the shape is final so the page
  // renders today and lights up later. User counts and the upper funnel steps
  // are real now.
  async revenueDetail(fromStr?: string, toStr?: string): Promise<AnalyticsRevenueDetail> {
    const today = daysAgo(0);
    const to = parseDayUtc(toStr) ?? today;
    let from = parseDayUtc(fromStr) ?? addDaysUtc(to, -6);
    if (from > to) from = addDaysUtc(to, -6);
    const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;

    const totalUsers = await this.users
      .createQueryBuilder('user')
      .where("user.role != 'admin'")
      .getCount();

    const revenueOverTime: RevenueOverTimePoint[] = [];
    for (let cur = new Date(from); cur <= to; cur = addDaysUtc(cur, 1)) {
      revenueOverTime.push({ label: shortLabel(cur), revenue: 0, mrr: 0, renewals: 0 });
    }

    const weeks = this.weekLabels(6);
    const usersBySubscription: UsersBySubscriptionPoint[] = weeks.map((label) => ({
      label,
      free: 0,
      premium: 0,
    }));
    const subscriptionGrowth: SubscriptionGrowthPoint[] = weeks.map((label) => ({
      label,
      newPremium: 0,
      cancellations: 0,
      renewals: 0,
    }));

    const planBreakdown: SubscriptionPlanBreakdown = {
      totalPremium: 0,
      totalPremiumPercent: 0,
      rows: [
        { plan: 'Free', users: totalUsers, percent: 100 },
        { plan: 'Premium Monthly', users: 0, percent: 0 },
        { plan: 'Premium Annually', users: 0, percent: 0 },
      ],
    };

    const revenueBreakdown: RevenueBreakdownCard[] = [
      { key: 'premium_monthly', label: 'Premium Monthly', value: 0, subLabel: '0 Subscriptions', changePercent: 0, up: true },
      { key: 'premium_annual', label: 'Premium Annual', value: 0, subLabel: '0 Subscriptions', changePercent: 0, up: true },
      { key: 'trial_conversions', label: 'Trial Conversions', value: 0, subLabel: '0% conversion rate', changePercent: 0, up: true },
      { key: 'renewals', label: 'Renewals', value: 0, subLabel: '0% retention rate', changePercent: 0, up: true },
    ];

    const funnel = await this.subscriptionFunnel();
    const funnelInsights = this.funnelInsights(funnel);

    const paymentProviders: PaymentProviderStat[] = [
      { key: 'paystack', provider: 'Paystack', revenue: 0, transactions: 0, successRate: 0, failedPayments: 0 },
      { key: 'stripe', provider: 'Stripe', revenue: 0, transactions: 0, successRate: 0, failedPayments: 0 },
      { key: 'apple_iap', provider: 'Apple IAP', revenue: 0, transactions: 0, successRate: 0, failedPayments: 0 },
      { key: 'google_play', provider: 'Google Play', revenue: 0, transactions: 0, successRate: 0, failedPayments: 0 },
    ];

    return {
      range: { from: ymd(from), to: ymd(to), days },
      revenueOverTime,
      revenueBreakdown,
      usersBySubscription,
      planBreakdown,
      subscriptionGrowth,
      funnel,
      funnelInsights,
      paymentProviders,
      recentPayments: [],
    };
  }

  private weekLabels(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `W${i + 1}`);
  }

  // Free-user → paid-subscriber funnel. Upper steps are real; paywall/trial/
  // subscribe are 0 until payments exist.
  private async subscriptionFunnel(): Promise<AnalyticsFunnelStep[]> {
    const [accountCreated, onboarded, startedLesson, completedLesson] = await Promise.all([
      this.users.createQueryBuilder('user').where("user.role != 'admin'").getCount(),
      this.users
        .createQueryBuilder('user')
        .where("user.role != 'admin'")
        .andWhere('user.language IS NOT NULL AND user.level IS NOT NULL')
        .getCount(),
      this.progress
        .createQueryBuilder('p')
        .select('COUNT(DISTINCT p.user_id)', 'c')
        .getRawOne<{ c: string }>()
        .then((r) => Number(r?.c ?? 0)),
      this.completions
        .createQueryBuilder('c')
        .select('COUNT(DISTINCT c.user_id)', 'c')
        .getRawOne<{ c: string }>()
        .then((r) => Number(r?.c ?? 0)),
    ]);

    const raw: { key: string; label: string; users: number }[] = [
      { key: 'account_created', label: 'Account created', users: accountCreated },
      { key: 'completed_onboarding', label: 'Completed Onboarding', users: onboarded },
      { key: 'started_first_lesson', label: 'Started first lesson', users: startedLesson },
      { key: 'completed_free_lessons', label: 'Completed free lessons', users: completedLesson },
      { key: 'viewed_paywall', label: 'Viewed paywall', users: 0 },
      { key: 'started_trial', label: 'Started trial', users: 0 },
      { key: 'subscribed', label: 'Subscribed', users: 0 },
    ];

    const top = raw[0]?.users ?? 0;
    return raw.map((step, i) => {
      const prev = i > 0 ? raw[i - 1].users : step.users;
      const percentOfTop = top > 0 ? Math.round((step.users / top) * 1000) / 10 : 0;
      const dropFromPrev =
        i === 0 || prev <= 0 ? 0 : Math.round(((prev - step.users) / prev) * 1000) / 10;
      return { key: step.key, label: step.label, users: step.users, percentOfTop, dropFromPrev };
    });
  }

  private funnelInsights(steps: AnalyticsFunnelStep[]): FunnelInsight[] {
    const insights: FunnelInsight[] = [];

    // Biggest drop-off between consecutive steps.
    let worst = { drop: -1, i: 1 };
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].dropFromPrev > worst.drop) worst = { drop: steps[i].dropFromPrev, i };
    }
    if (steps.length > 1) {
      insights.push({
        key: 'biggest_drop',
        label: 'Biggest drop-off point',
        detail: `${steps[worst.i - 1].label} → ${steps[worst.i].label}`,
        value: `-${worst.drop}%`,
        tone: 'negative',
      });
    }

    // Best converting consecutive step (highest pass-through).
    let best = { pass: -1, i: 1 };
    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1].users;
      const pass = prev > 0 ? Math.round((steps[i].users / prev) * 1000) / 10 : 0;
      if (pass > best.pass) best = { pass, i };
    }
    if (steps.length > 1) {
      insights.push({
        key: 'best_step',
        label: 'Best conversion step',
        detail: `${steps[best.i - 1].label} → ${steps[best.i].label}`,
        value: `${best.pass}%`,
        tone: 'positive',
      });
    }

    // Overall: first → last.
    const first = steps[0]?.users ?? 0;
    const last = steps[steps.length - 1]?.users ?? 0;
    const overall = first > 0 ? Math.round((last / first) * 1000) / 10 : 0;
    insights.push({
      key: 'overall_rate',
      label: 'Overall funnel rate',
      detail: `${steps[0]?.label ?? 'Start'} → ${steps[steps.length - 1]?.label ?? 'End'}`,
      value: `${overall}%`,
      tone: 'neutral',
    });

    return insights;
  }
}
