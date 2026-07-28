import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ENTITLED_SUBSCRIPTION_STATUSES,
  LEARNING_LEVELS,
  LEARNING_LEVEL_LABELS,
  LESSON_TYPES,
  LESSON_TYPE_LABELS,
  PROVIDER_KEYS,
  PROVIDER_TEXT,
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
  type PaymentActivityItem,
  type PaymentActivityType,
  type PaymentProviderStat,
  type PlanBreakdownRow,
  type ProviderKey,
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
import { Invoice } from '../payments/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Subscription } from '../payments/entities/subscription.entity';
import { SubscriptionStatusEvent } from '../payments/entities/subscription-status-event.entity';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { User } from '../users/entities/user.entity';
import { LessonCompletion } from '../progress/entities/lesson-completion.entity';
import { LessonProgress } from '../progress/entities/lesson-progress.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
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

interface RevenueContext {
  subscriptions: Subscription[];
  paymentsList: Payment[];
  plansById: Map<string, SubscriptionPlan>;
  subscriptionById: Map<string, Subscription>;
  invoiceById: Map<string, Invoice>;
  /** First (by period start) invoice id per subscription — that payment is
   * the conversion; every later one on the same subscription is a renewal. */
  firstInvoiceIdBySubscription: Map<string, string>;
  /** Real status-transition log per subscription, sorted oldest → newest. */
  eventsBySubscription: Map<string, SubscriptionStatusEvent[]>;
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

const ENTITLED_STATUSES = new Set<string>(ENTITLED_SUBSCRIPTION_STATUSES);

/** The currency blended top-line figures (charts, "by plan" cards) are reported in. */
const BLEND_CURRENCY = 'usd';

/** Shown on a provider's card only when it has no real payments yet. */
const PROVIDER_DEFAULT_CURRENCY: Record<ProviderKey, string> = {
  stripe: 'usd',
  paystack: 'ngn',
  apple_iap: 'usd',
};

/**
 * A payment's value in USD minor units (cents) for the blended totals, or
 * null when its currency has no admin-set rate to convert with — there's no
 * live FX provider integrated; `fxRatesToUsd` comes from PlatformSettings,
 * set and revisited manually by an admin (units of that currency per 1 USD).
 * Every currency this app bills in stores minor units (cents/kobo) at the
 * same 1/100 scale, so dividing by the major-unit rate converts minor units
 * directly — no extra ×100/÷100 needed.
 */
function toUsdMinor(
  payment: Payment,
  fxRatesToUsd: Partial<Record<string, number>>,
): number | null {
  const currency = payment.currency.toUpperCase();
  if (currency === BLEND_CURRENCY.toUpperCase()) return payment.amountMinor;
  const rate = fxRatesToUsd[currency];
  if (!rate) return null;
  return Math.round(payment.amountMinor / rate);
}

function monthlyEquivalent(amount: number, period: string): number {
  switch (period) {
    case 'Year':
      return amount / 12;
    case 'Quarter':
      return amount / 3;
    default:
      return amount;
  }
}

/**
 * Fallback-only heuristic for "was this subscription's access live at `at`",
 * from snapshot fields alone — used solely for subscriptions that transitioned
 * before `subscription_status_events` existed, so their exact history is
 * unrecoverable. Can't see intermediate PAST_DUE/PAUSED detours, just the
 * create/cancel/period window. Prefer `isEntitledAt`, which uses the real log
 * when one exists for the subscription in question.
 */
function wasLikelyEntitledAt(sub: Subscription, at: Date): boolean {
  if (sub.status === 'INCOMPLETE') return false;
  if (sub.createdAt > at) return false;
  if (sub.canceledAt && sub.canceledAt <= at) return false;
  if (sub.currentPeriodEnd && sub.currentPeriodEnd < at) return false;
  return true;
}

/**
 * Was this subscription entitled at `at`? Uses the real status-history log
 * when this subscription has one; falls back to the snapshot heuristic only
 * when it has zero logged events but its current status isn't INCOMPLETE —
 * meaning it transitioned before event-logging shipped, so its exact history
 * before "now" can't be known.
 */
function isEntitledAt(sub: Subscription, events: SubscriptionStatusEvent[], at: Date): boolean {
  if (sub.createdAt > at) return false;
  if (events.length === 0) {
    if (sub.status === 'INCOMPLETE') return false; // accurate: never transitioned
    return wasLikelyEntitledAt(sub, at);
  }
  // The status immediately before the earliest logged event is that event's
  // `fromStatus` (always INCOMPLETE in practice — a subscription's first-ever
  // transition — but read from the log rather than assumed).
  let status: string = events[0].fromStatus;
  for (const event of events) {
    if (event.occurredAt > at) break;
    status = event.toStatus;
  }
  return ENTITLED_STATUSES.has(status);
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
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(SubscriptionPlan)
    private readonly plans: Repository<SubscriptionPlan>,
    @InjectRepository(SubscriptionStatusEvent)
    private readonly statusEvents: Repository<SubscriptionStatusEvent>,
    private readonly platformSettings: PlatformSettingsService,
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
      this.revenue(from, to),
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
    const [total, premium] = await Promise.all([
      this.users.createQueryBuilder('user').where("user.role != 'admin'").getCount(),
      this.subscriptions
        .createQueryBuilder('sub')
        .select('COUNT(DISTINCT sub.user_id)', 'c')
        .where('sub.status IN (:...statuses)', { statuses: [...ENTITLED_STATUSES] })
        .getRawOne<{ c: string }>()
        .then((r) => Number(r?.c ?? 0)),
    ]);
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

  private async revenue(from: Date, to: Date): Promise<AnalyticsRevenue> {
    const [ctx, settings] = await Promise.all([
      this.loadRevenueContext(),
      this.platformSettings.getCached(),
    ]);
    const fxRatesToUsd = settings.fxRatesToUsd;
    const endExcl = addDaysUtc(to, 1);
    const inRange = ctx.paymentsList
      .filter((p) => p.status === 'PAID' && p.createdAt >= from && p.createdAt < endExcl)
      .map((p) => ({ payment: p, usdMinor: toUsdMinor(p, fxRatesToUsd) }))
      .filter((r): r is { payment: Payment; usdMinor: number } => r.usdMinor !== null);
    const totalRevenue = inRange.reduce((sum, r) => sum + r.usdMinor, 0) / 100;

    const spark: number[] = [];
    for (let cur = new Date(from); cur <= to; cur = addDaysUtc(cur, 1)) {
      const dayEndExcl = addDaysUtc(cur, 1);
      const dayCents = inRange
        .filter((r) => r.payment.createdAt >= cur && r.payment.createdAt < dayEndExcl)
        .reduce((sum, r) => sum + r.usdMinor, 0);
      spark.push(dayCents / 100);
    }

    const periodLabel: Record<string, string> = {
      Month: 'Monthly Plan',
      Quarter: 'Quarterly Plan',
      Year: 'Annual Plan',
    };
    const plans = (['Month', 'Quarter', 'Year'] as const).map((period) => {
      const planIds = new Set(
        [...ctx.plansById.values()].filter((p) => p.period === period).map((p) => p.id),
      );
      const users = ctx.subscriptions.filter(
        (s) => ENTITLED_STATUSES.has(s.status) && planIds.has(s.planId),
      ).length;
      const revenueCents = inRange
        .filter((r) => {
          const invoice = ctx.invoiceById.get(r.payment.invoiceId);
          const sub = invoice ? ctx.subscriptionById.get(invoice.subscriptionId) : null;
          return sub ? planIds.has(sub.planId) : false;
        })
        .reduce((sum, r) => sum + r.usdMinor, 0);
      return { plan: periodLabel[period], users, revenue: revenueCents / 100 };
    });

    // There's no separate one-time-purchase revenue in this app — every
    // payment is subscription-driven, so both figures are the same total.
    return { totalRevenue, paidSubscriptionRevenue: totalRevenue, spark, plans };
  }

  /**
   * Loads the small payments-domain tables once per request and derives the
   * lookups every revenue computation needs. Fetching in full and joining in
   * memory (rather than N targeted queries) is the simplest correct approach
   * at this data volume, and mirrors how a single admin request is expected
   * to behave — this is not a hot path.
   */
  private async loadRevenueContext(): Promise<RevenueContext> {
    const [subscriptions, invoices, paymentsList, planRows, events] = await Promise.all([
      this.subscriptions.find(),
      this.invoices.find(),
      this.payments.find(),
      this.plans.find(),
      this.statusEvents.find(),
    ]);

    const plansById = new Map(planRows.map((p) => [p.id, p]));
    const subscriptionById = new Map(subscriptions.map((s) => [s.id, s]));
    const invoiceById = new Map(invoices.map((inv) => [inv.id, inv]));

    const earliestBySubscription = new Map<string, Invoice>();
    for (const inv of invoices) {
      const cur = earliestBySubscription.get(inv.subscriptionId);
      if (!cur || inv.periodStart < cur.periodStart) earliestBySubscription.set(inv.subscriptionId, inv);
    }
    const firstInvoiceIdBySubscription = new Map(
      [...earliestBySubscription].map(([subId, inv]) => [subId, inv.id]),
    );

    const eventsBySubscription = new Map<string, SubscriptionStatusEvent[]>();
    for (const event of events) {
      const list = eventsBySubscription.get(event.subscriptionId) ?? [];
      list.push(event);
      eventsBySubscription.set(event.subscriptionId, list);
    }
    for (const list of eventsBySubscription.values()) {
      list.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    }

    return {
      subscriptions,
      paymentsList,
      plansById,
      subscriptionById,
      invoiceById,
      firstInvoiceIdBySubscription,
      eventsBySubscription,
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
  // Everything below is real, sourced from subscriptions/invoices/payments/
  // subscription_status_events. One remaining honest simplification:
  //  - Blended/top-line figures (revenueOverTime, MRR, the "by plan" cards)
  //    convert non-USD provider revenue using the admin-set `fxRatesToUsd` rates (see
  //    `toUsdMinor`) — there's no live FX feed, so this needs periodic manual
  //    upkeep. Paystack's real revenue is also always shown unconverted on
  //    its own provider card.
  // Historical "was this subscription premium at time T" is exact wherever
  // `subscription_status_events` has a record (every transition from here on)
  // — see `isEntitledAt`. It only falls back to the old snapshot heuristic
  // for subscriptions that transitioned before that log existed, since their
  // exact history can't be reconstructed retroactively.
  async revenueDetail(fromStr?: string, toStr?: string): Promise<AnalyticsRevenueDetail> {
    const today = daysAgo(0);
    const to = parseDayUtc(toStr) ?? today;
    let from = parseDayUtc(fromStr) ?? addDaysUtc(to, -6);
    if (from > to) from = addDaysUtc(to, -6);
    const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
    const endExcl = addDaysUtc(to, 1);

    const [totalUsers, ctx, settings] = await Promise.all([
      this.users.createQueryBuilder('user').where("user.role != 'admin'").getCount(),
      this.loadRevenueContext(),
      this.platformSettings.getCached(),
    ]);
    const fxRatesToUsd = settings.fxRatesToUsd;

    // Payments in [from, to), converted to USD minor units for blending.
    // Currencies this app can't convert (anything but usd/ngn) are dropped
    // rather than mixed in unconverted — see `toUsdMinor`.
    const convertedInRange = ctx.paymentsList
      .filter((p) => p.status === 'PAID' && p.createdAt >= from && p.createdAt < endExcl)
      .map((p) => ({ payment: p, usdMinor: toUsdMinor(p, fxRatesToUsd) }))
      .filter((r): r is { payment: Payment; usdMinor: number } => r.usdMinor !== null);

    // ---- Daily revenue / MRR / renewal count ----
    const revenueOverTime: RevenueOverTimePoint[] = [];
    for (let cur = new Date(from); cur <= to; cur = addDaysUtc(cur, 1)) {
      const dayEndExcl = addDaysUtc(cur, 1);
      const dayPayments = convertedInRange.filter(
        (r) => r.payment.createdAt >= cur && r.payment.createdAt < dayEndExcl,
      );
      const revenue = dayPayments.reduce((sum, r) => sum + r.usdMinor, 0) / 100;
      const renewals = dayPayments.filter((r) => !this.isConversionPayment(r.payment, ctx)).length;
      // MRR is read from the catalog's USD base price, not actual charges, so
      // it's already currency-agnostic — every entitled subscription counts
      // regardless of which currency its provider bills in.
      const mrr = ctx.subscriptions
        .filter((s) => isEntitledAt(s, ctx.eventsBySubscription.get(s.id) ?? [], cur))
        .reduce((sum, s) => {
          const plan = ctx.plansById.get(s.planId);
          return sum + monthlyEquivalent(plan ? Number(plan.price) : 0, plan?.period ?? 'Month');
        }, 0);
      revenueOverTime.push({
        label: shortLabel(cur),
        revenue,
        mrr: Math.round(mrr * 100) / 100,
        renewals,
      });
    }

    // ---- Weekly: users by subscription + subscription growth ----
    const weeks = this.weekWindows(6);
    const usersBySubscription: UsersBySubscriptionPoint[] = await Promise.all(
      weeks.map(async (w) => {
        const premium = ctx.subscriptions.filter((s) =>
          isEntitledAt(s, ctx.eventsBySubscription.get(s.id) ?? [], w.endExcl),
        ).length;
        const usersAtWeekEnd = await this.users
          .createQueryBuilder('user')
          .where("user.role != 'admin'")
          .andWhere('user.created_at < :end', { end: w.endExcl })
          .getCount();
        return { label: w.label, free: Math.max(usersAtWeekEnd - premium, 0), premium };
      }),
    );

    const subscriptionGrowth: SubscriptionGrowthPoint[] = weeks.map((w) => {
      const paidInWeek = ctx.paymentsList.filter(
        (p) => p.status === 'PAID' && p.createdAt >= w.start && p.createdAt < w.endExcl,
      );
      const newPremium = paidInWeek.filter((p) => this.isConversionPayment(p, ctx)).length;
      const renewals = paidInWeek.filter((p) => !this.isConversionPayment(p, ctx)).length;
      const cancellations = ctx.subscriptions.filter(
        (s) => s.canceledAt && s.canceledAt >= w.start && s.canceledAt < w.endExcl,
      ).length;
      return { label: w.label, newPremium, cancellations, renewals };
    });

    // ---- Current plan breakdown (today's snapshot, every provider/currency) ----
    const periodLabel: Record<string, string> = {
      Month: 'Premium Monthly',
      Quarter: 'Premium Quarterly',
      Year: 'Premium Annually',
    };
    const entitledSubs = ctx.subscriptions.filter((s) => ENTITLED_STATUSES.has(s.status));
    const planRows: PlanBreakdownRow[] = (['Month', 'Quarter', 'Year'] as const).map((period) => {
      const planIds = this.planIdsForPeriod(ctx, period);
      const users = entitledSubs.filter((s) => planIds.has(s.planId)).length;
      return {
        plan: periodLabel[period],
        users,
        percent: totalUsers > 0 ? Math.round((users / totalUsers) * 100) : 0,
      };
    });
    const totalPremium = planRows.reduce((sum, r) => sum + r.users, 0);
    const freeUsers = Math.max(totalUsers - totalPremium, 0);
    const planBreakdown: SubscriptionPlanBreakdown = {
      totalPremium,
      totalPremiumPercent: totalUsers > 0 ? Math.round((totalPremium / totalUsers) * 100) : 0,
      rows: [
        {
          plan: 'Free',
          users: freeUsers,
          percent: totalUsers > 0 ? Math.round((freeUsers / totalUsers) * 100) : 100,
        },
        ...planRows,
      ],
    };

    // ---- Revenue breakdown cards (USD-blended; prior equal-length window for trend) ----
    const prevTo = addDaysUtc(from, -1);
    const prevFrom = addDaysUtc(prevTo, -(days - 1));
    const prevEndExcl = addDaysUtc(prevTo, 1);
    const convertedPrevRange = ctx.paymentsList
      .filter((p) => p.status === 'PAID' && p.createdAt >= prevFrom && p.createdAt < prevEndExcl)
      .map((p) => ({ payment: p, usdMinor: toUsdMinor(p, fxRatesToUsd) }))
      .filter((r): r is { payment: Payment; usdMinor: number } => r.usdMinor !== null);

    const revenueForPeriod = (
      period: 'Month' | 'Quarter' | 'Year',
      pool: { payment: Payment; usdMinor: number }[],
    ): number => {
      const planIds = this.planIdsForPeriod(ctx, period);
      return (
        pool
          .filter((r) => {
            const invoice = ctx.invoiceById.get(r.payment.invoiceId);
            const sub = invoice ? ctx.subscriptionById.get(invoice.subscriptionId) : null;
            return sub ? planIds.has(sub.planId) : false;
          })
          .reduce((sum, r) => sum + r.usdMinor, 0) / 100
      );
    };
    const usersForPeriod = (period: 'Month' | 'Quarter' | 'Year'): number =>
      entitledSubs.filter((s) => this.planIdsForPeriod(ctx, period).has(s.planId)).length;

    const conversions = convertedInRange.filter((r) => this.isConversionPayment(r.payment, ctx));
    const renewalPayments = convertedInRange.filter((r) => !this.isConversionPayment(r.payment, ctx));
    const conversionsPrevCount = convertedPrevRange.filter((r) =>
      this.isConversionPayment(r.payment, ctx),
    ).length;
    const renewalsPrevCount = convertedPrevRange.filter(
      (r) => !this.isConversionPayment(r.payment, ctx),
    ).length;
    const cancellationsInRange = ctx.subscriptions.filter(
      (s) => s.canceledAt && s.canceledAt >= from && s.canceledAt < endExcl,
    ).length;
    const conversionRevenue = conversions.reduce((sum, r) => sum + r.usdMinor, 0) / 100;
    const renewalRevenue = renewalPayments.reduce((sum, r) => sum + r.usdMinor, 0) / 100;
    const conversionRate =
      totalUsers > 0 ? Math.round((conversions.length / totalUsers) * 1000) / 10 : 0;
    const retentionRate =
      renewalPayments.length + cancellationsInRange > 0
        ? Math.round(
            (renewalPayments.length / (renewalPayments.length + cancellationsInRange)) * 1000,
          ) / 10
        : 0;

    const revenueBreakdown: RevenueBreakdownCard[] = [
      {
        key: 'premium_monthly',
        label: 'Premium Monthly',
        value: revenueForPeriod('Month', convertedInRange),
        subLabel: `${usersForPeriod('Month')} Subscriptions`,
        ...pctChange(
          revenueForPeriod('Month', convertedInRange),
          revenueForPeriod('Month', convertedPrevRange),
        ),
      },
      {
        key: 'premium_quarterly',
        label: 'Premium Quarterly',
        value: revenueForPeriod('Quarter', convertedInRange),
        subLabel: `${usersForPeriod('Quarter')} Subscriptions`,
        ...pctChange(
          revenueForPeriod('Quarter', convertedInRange),
          revenueForPeriod('Quarter', convertedPrevRange),
        ),
      },
      {
        key: 'premium_annual',
        label: 'Premium Annual',
        value: revenueForPeriod('Year', convertedInRange),
        subLabel: `${usersForPeriod('Year')} Subscriptions`,
        ...pctChange(
          revenueForPeriod('Year', convertedInRange),
          revenueForPeriod('Year', convertedPrevRange),
        ),
      },
      {
        key: 'trial_conversions',
        label: 'Trial Conversions',
        value: conversionRevenue,
        subLabel: `${conversionRate}% conversion rate`,
        ...pctChange(conversions.length, conversionsPrevCount),
      },
      {
        key: 'renewals',
        label: 'Renewals',
        value: renewalRevenue,
        subLabel: `${retentionRate}% retention rate`,
        ...pctChange(renewalPayments.length, renewalsPrevCount),
      },
    ];

    const funnel = await this.subscriptionFunnel();
    const funnelInsights = this.funnelInsights(funnel);

    // ---- Per-provider stats, each in its own real currency (no blending) ----
    const paymentProviders: PaymentProviderStat[] = (PROVIDER_KEYS as readonly ProviderKey[]).map(
      (key) => {
        const providerPayments = ctx.paymentsList.filter((p) => p.provider === key);
        const paidInRange = providerPayments.filter(
          (p) => p.status === 'PAID' && p.createdAt >= from && p.createdAt < endExcl,
        );
        const failedInRange = providerPayments.filter(
          (p) => p.status === 'FAILED' && p.createdAt >= from && p.createdAt < endExcl,
        );
        const transactions = paidInRange.length + failedInRange.length;
        const revenue = paidInRange.reduce((sum, p) => sum + p.amountMinor, 0) / 100;
        const currency = (providerPayments[0]?.currency ?? PROVIDER_DEFAULT_CURRENCY[key]).toLowerCase();
        return {
          key,
          provider: PROVIDER_TEXT[key],
          revenue,
          transactions,
          successRate:
            transactions > 0 ? Math.round((paidInRange.length / transactions) * 1000) / 10 : 0,
          failedPayments: failedInRange.length,
          currency,
        };
      },
    );

    const recentPayments = await this.recentPaymentActivity(ctx, 8);

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
      recentPayments,
    };
  }

  private planIdsForPeriod(ctx: RevenueContext, period: string): Set<string> {
    return new Set(
      [...ctx.plansById.values()].filter((p) => p.period === period).map((p) => p.id),
    );
  }

  private isConversionPayment(payment: Payment, ctx: RevenueContext): boolean {
    const invoice = ctx.invoiceById.get(payment.invoiceId);
    if (!invoice) return false;
    return ctx.firstInvoiceIdBySubscription.get(invoice.subscriptionId) === invoice.id;
  }

  /** Recent conversion/renewal/cancellation events, newest first. */
  private async recentPaymentActivity(
    ctx: RevenueContext,
    limit: number,
  ): Promise<PaymentActivityItem[]> {
    const paidPayments = ctx.paymentsList.filter((p) => p.status === 'PAID');
    const userIds = new Set<string>();
    for (const p of paidPayments) userIds.add(p.userId);
    for (const s of ctx.subscriptions) if (s.canceledAt) userIds.add(s.userId);
    if (userIds.size === 0) return [];

    const users = await this.users.find({ where: { id: In([...userIds]) } });
    const userById = new Map(users.map((u) => [u.id, u]));

    const events: { at: Date; item: PaymentActivityItem }[] = [];

    for (const p of paidPayments) {
      const user = userById.get(p.userId);
      if (!user) continue;
      const invoice = ctx.invoiceById.get(p.invoiceId);
      const sub = invoice ? ctx.subscriptionById.get(invoice.subscriptionId) : null;
      const plan = sub ? ctx.plansById.get(sub.planId) : null;
      const isConversion = this.isConversionPayment(p, ctx);
      const type: PaymentActivityType = isConversion ? 'Conversion' : 'Renewal';
      events.push({
        at: p.createdAt,
        item: {
          id: `payment:${p.id}`,
          name: user.displayName,
          description: isConversion
            ? `subscribed to ${plan?.name ?? 'a plan'}`
            : `renewed ${plan?.name ?? 'their plan'}`,
          type,
          at: p.createdAt.toISOString(),
        },
      });
    }

    for (const s of ctx.subscriptions) {
      if (!s.canceledAt) continue;
      const user = userById.get(s.userId);
      if (!user) continue;
      const plan = ctx.plansById.get(s.planId);
      events.push({
        at: s.canceledAt,
        item: {
          id: `cancel:${s.id}`,
          name: user.displayName,
          description: `cancelled ${plan?.name ?? 'their plan'}`,
          type: 'Cancellation',
          at: s.canceledAt.toISOString(),
        },
      });
    }

    return events
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, limit)
      .map((e) => e.item);
  }

  /** Six non-overlapping 7-day windows ending today, oldest ("W1") to newest ("W6"). */
  private weekWindows(count: number): { label: string; start: Date; endExcl: Date }[] {
    const today = daysAgo(0);
    const windows: { label: string; start: Date; endExcl: Date }[] = [];
    for (let i = count; i >= 1; i--) {
      const endExcl = addDaysUtc(today, -(i - 1) * 7);
      const start = addDaysUtc(endExcl, -7);
      windows.push({ label: `W${count - i + 1}`, start, endExcl });
    }
    return windows;
  }

  // Free-user → paid-subscriber funnel. Upper steps and "Subscribed" are real;
  // paywall/trial views aren't tracked anywhere (no analytics-event table), so
  // those two stay at 0 rather than fabricate a number.
  private async subscriptionFunnel(): Promise<AnalyticsFunnelStep[]> {
    const [accountCreated, onboarded, startedLesson, completedLesson, subscribed] =
      await Promise.all([
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
        // Ever reached a paid state — not just currently entitled — so a
        // lapsed/cancelled subscriber still counts as having converted once.
        this.subscriptions
          .createQueryBuilder('sub')
          .select('COUNT(DISTINCT sub.user_id)', 'c')
          .where("sub.status != 'INCOMPLETE'")
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
      { key: 'subscribed', label: 'Subscribed', users: subscribed },
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
