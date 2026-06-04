import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ACTIVE_WINDOW_DAYS,
  LANGUAGE_LABELS,
  LEARNING_LEVELS,
  LEARNING_LEVEL_LABELS,
  type AnalyticsActiveUsers,
  type AnalyticsDailyActivityPoint,
  type AnalyticsDashboard,
  type AnalyticsFunnelStep,
  type AnalyticsKpi,
  type AnalyticsLevelProgress,
  type AnalyticsOverview,
  type AnalyticsTopLanguage,
  type AnalyticsTopLesson,
  type LanguageCode,
  type LearningLevel,
  type XpDistributionBucket,
} from '@lexiroot/shared';
import { XpLedgerEntry } from '../gamification/entities/xp-ledger-entry.entity';
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
const LESSON_COLORS = ['#16A34A', '#E35336', '#F9D506', '#1FC0E0', '#814231'];

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

interface DailyRow {
  day: string;
  active: string;
  new_users: string;
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

function activeCutoff(): Date {
  const d = new Date();
  d.setDate(d.getDate() - ACTIVE_WINDOW_DAYS);
  return d;
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
  ) {}

  async overview(): Promise<AnalyticsOverview> {
    const [
      totalUsers,
      activeUsers,
      lessonsCompleted,
      xpEarned,
      dailyActivity,
      topLanguages,
      topLessons,
    ] = await Promise.all([
      this.users.count(),
      this.countActiveUsers(),
      this.completions.count(),
      this.sumXp(),
      this.dailyActivity(),
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

  private async countActiveUsers(): Promise<number> {
    return this.users
      .createQueryBuilder('user')
      .where('user.last_active_at IS NOT NULL AND user.last_active_at >= :cutoff', {
        cutoff: activeCutoff(),
      })
      .getCount();
  }

  private async sumXp(): Promise<number> {
    const result = await this.users
      .createQueryBuilder('user')
      .select('COALESCE(SUM(user.xp), 0)', 'total')
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  private async dailyActivity(): Promise<AnalyticsDailyActivityPoint[]> {
    const start = daysAgo(ACTIVITY_WINDOW_DAYS - 1);

    const active: DailyRow[] = await this.users.query(
      `
        SELECT to_char(day, 'YYYY-MM-DD') AS day,
               COUNT(DISTINCT user_id)::text AS active,
               '0' AS new_users
        FROM (
          SELECT "id" AS user_id, date_trunc('day', "last_active_at" AT TIME ZONE 'UTC') AS day
          FROM "users"
          WHERE "last_active_at" >= $1

          UNION ALL

          SELECT "user_id" AS user_id, date_trunc('day', "completed_at" AT TIME ZONE 'UTC') AS day
          FROM "lesson_completions"
          WHERE "completed_at" >= $1

          UNION ALL

          SELECT "user_id" AS user_id, date_trunc('day', "updated_at" AT TIME ZONE 'UTC') AS day
          FROM "lesson_progress"
          WHERE "updated_at" >= $1
        ) activity
        GROUP BY day
        `,
      [start],
    );

    const created: DailyRow[] = await this.users
      .createQueryBuilder('user')
      .select(`to_char(date_trunc('day', user.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`, 'day')
      .addSelect('0', 'active')
      .addSelect('COUNT(*)', 'new_users')
      .where('user.created_at >= :start', { start })
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
    for (let i = ACTIVITY_WINDOW_DAYS - 1; i >= 0; i--) {
      const day = daysAgo(i);
      const key = day.toISOString().slice(0, 10);
      const e = map.get(key) ?? { active: 0, newUsers: 0 };
      points.push({
        date: key,
        label: shortLabel(day),
        active: e.active,
        newUsers: e.newUsers,
      });
    }
    return points;
  }

  private async topLanguages(): Promise<AnalyticsTopLanguage[]> {
    const rows: LangRow[] = await this.users
      .createQueryBuilder('user')
      .select('user.language', 'language')
      .addSelect('COUNT(*)', 'count')
      .where('user.language IS NOT NULL')
      .groupBy('user.language')
      .getRawMany();

    const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
    const seen = new Set<string>();
    const out: AnalyticsTopLanguage[] = [];
    for (const r of rows) {
      const code = r.language as LanguageCode;
      if (!code || !(code in LANGUAGE_LABELS)) continue;
      seen.add(code);
      const percent = total > 0 ? Math.round((Number(r.count) / total) * 100) : 0;
      out.push({
        language: LANGUAGE_LABELS[code],
        code,
        percent,
        color: LANGUAGE_COLORS[code] ?? '#7A7878',
      });
    }
    // Backfill remaining supported languages at 0% so the chart shows all options.
    for (const code of Object.keys(LANGUAGE_LABELS) as LanguageCode[]) {
      if (seen.has(code)) continue;
      out.push({
        language: LANGUAGE_LABELS[code],
        code,
        percent: 0,
        color: LANGUAGE_COLORS[code] ?? '#7A7878',
      });
    }
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
      topLanguages,
      progressByLevel,
      xpDistribution,
      topLessons,
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
      this.topLanguages(),
      this.progressByLevel(),
      this.xpDistribution(),
      this.topLessons(6),
      this.funnel(),
    ]);

    const activeUsersKpi: AnalyticsKpi = { value: activeCurr, ...pctChange(activeCurr, activePrev) };

    const dashboardKpis: AnalyticsDashboard['kpis'] = {
      activeUsers: activeUsersKpi,
      lessonsCompleted: { value: lessonsCurr, ...pctChange(lessonsCurr, lessonsPrev) },
      xpEarned: { value: xpCurr, ...pctChange(xpCurr, xpPrev) },
      // Streaks aren't stored historically, so the headline is the current
      // active-streak count and the trend mirrors active-user growth (the
      // engagement that keeps streaks alive).
      dailyStreaks: { value: activeStreaks, ...pctChange(activeCurr, activePrev) },
    };

    const activeUsers: AnalyticsActiveUsers = { dau, wau, mau };

    return {
      range: { from: ymd(from), to: ymd(to), days },
      kpis: dashboardKpis,
      activeUsers,
      activeStreaks,
      dailyActivity,
      topLanguages,
      progressByLevel,
      xpDistribution,
      topLessons,
      funnel,
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
}
