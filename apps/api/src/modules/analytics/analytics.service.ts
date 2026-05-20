import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ACTIVE_WINDOW_DAYS,
  LANGUAGE_LABELS,
  type AnalyticsDailyActivityPoint,
  type AnalyticsOverview,
  type AnalyticsTopLanguage,
  type AnalyticsTopLesson,
  type LanguageCode,
} from '@lexiroot/shared';
import { Lesson } from '../lessons/entities/lesson.entity';
import { User } from '../users/entities/user.entity';
import { LessonCompletion } from '../progress/entities/lesson-completion.entity';

const ACTIVITY_WINDOW_DAYS = 7;

// Brand colors used for the language donut + lesson progress bars.
const LANGUAGE_COLORS: Record<LanguageCode, string> = {
  yo: '#E35336',
  ig: '#1FC0E0',
  ha: '#F9D506',
};
const LESSON_COLORS = ['#16A34A', '#E35336', '#F9D506', '#1FC0E0', '#814231'];

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

    const active: DailyRow[] = await this.users
      .createQueryBuilder('user')
      .select(`to_char(date_trunc('day', user.last_active_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`, 'day')
      .addSelect('COUNT(*)', 'active')
      .addSelect('0', 'new_users')
      .where('user.last_active_at >= :start', { start })
      .groupBy('day')
      .getRawMany();

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

  private async topLessons(): Promise<AnalyticsTopLesson[]> {
    const rows: LessonRow[] = await this.lessons
      .createQueryBuilder('lesson')
      .leftJoin(
        'lesson_completions',
        'completion',
        'completion.lesson_id = lesson.id',
      )
      .select('lesson.id', 'id')
      .addSelect('lesson.title', 'title')
      .addSelect('lesson.tier', 'tier')
      .addSelect('COUNT(completion.id)', 'completions')
      .where('lesson.status = :status', { status: 'published' })
      .groupBy('lesson.id')
      .orderBy('completions', 'DESC')
      .limit(4)
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
}
