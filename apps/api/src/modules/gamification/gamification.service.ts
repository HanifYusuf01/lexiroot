import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  levelFromXp,
  type GamificationStats,
  type LeaderboardEntry,
  type LeaderboardPage,
  type RecentBadge,
  type StreakOverview,
  type TopXpEarner,
  type TopXpEarnersPage,
  type UserAchievement as UserAchievementDTO,
  type XpDistributionBucket,
} from '@lexiroot/shared';
import { User } from '../users/entities/user.entity';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import {
  XpLedgerEntry,
  type XpReason,
  type XpSourceType,
} from './entities/xp-ledger-entry.entity';

interface RecordXpArgs {
  userId: string;
  amount: number;
  reason: XpReason;
  sourceType?: XpSourceType;
  sourceId?: string | null;
  metadata?: Record<string, unknown>;
}

const XP_BUCKETS: { label: string; min: number; max: number | null }[] = [
  { label: '0 - 500 XP', min: 0, max: 500 },
  { label: '501 - 1500 XP', min: 501, max: 1500 },
  { label: '1,501 - 3000 XP', min: 1501, max: 3000 },
  { label: '3001 - 5000 XP', min: 3001, max: 5000 },
  { label: '5,001+ XP', min: 5001, max: null },
];

function startOfMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Achievement)
    private readonly achievements: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievements: Repository<UserAchievement>,
    @InjectRepository(XpLedgerEntry)
    private readonly xpLedger: Repository<XpLedgerEntry>,
  ) {}

  // ---------- Leaderboard (mobile) ----------

  async leaderboard(page: number, limit: number): Promise<LeaderboardPage> {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const offset = (safePage - 1) * safeLimit;

    const [rows, total] = await this.users
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.displayName',
        'u.avatarUrl',
        'u.country',
        'u.xp',
        'u.currentStreakDays',
      ])
      .where('u.role != :role', { role: 'admin' })
      .orderBy('u.xp', 'DESC')
      .addOrderBy('u.createdAt', 'ASC')
      .skip(offset)
      .take(safeLimit)
      .getManyAndCount();

    const items: LeaderboardEntry[] = rows.map((u, i) => ({
      rank: offset + i + 1,
      userId: u.id,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      country: u.country,
      xp: u.xp ?? 0,
      level: levelFromXp(u.xp ?? 0),
      currentStreakDays: u.currentStreakDays ?? 0,
    }));

    return { items, page: safePage, limit: safeLimit, total };
  }

  // ---------- Achievements (mobile) ----------

  async myAchievements(userId: string): Promise<UserAchievementDTO[]> {
    const rows = await this.userAchievements.find({
      where: { userId },
      relations: { achievement: true },
      order: { earnedAt: 'ASC' },
    });
    return rows.map((r) => ({
      id: r.id,
      earnedAt: r.earnedAt.toISOString(),
      achievement: {
        id: r.achievement.id,
        code: r.achievement.code,
        title: r.achievement.title,
        description: r.achievement.description,
        iconKey: r.achievement.iconKey,
        kind: r.achievement.kind,
        threshold: r.achievement.threshold,
        order: r.achievement.order,
      },
    }));
  }

  async catalog() {
    return this.achievements.find({ order: { order: 'ASC' } });
  }

  // ---------- Admin ----------

  async adminStats(): Promise<GamificationStats> {
    const monthStart = startOfMonth();

    const [
      xpAgg,
      newXpThisMonthRow,
      activeStreaksRow,
      newStreaksThisMonthRow,
      badgesTotalRow,
      newBadgesThisMonthRow,
      participantsRow,
      newParticipantsThisMonthRow,
      bucketsRaw,
      streakOverview,
      recentBadges,
    ] = await Promise.all([
      this.users
        .createQueryBuilder('u')
        .select('COALESCE(SUM(u.xp), 0)', 'sum')
        .getRawOne<{ sum: string }>(),
      // New XP this month — sum every ledger entry in the window. Authoritative
      // even when XP eventually comes from sources other than lesson completion
      // (achievement bonuses, streak bonuses, admin adjustments).
      this.xpLedger
        .createQueryBuilder('x')
        .select('COALESCE(SUM(x.amount), 0)', 'sum')
        .where('x.createdAt >= :since', { since: monthStart })
        .getRawOne<{ sum: string }>(),
      this.users
        .createQueryBuilder('u')
        .select('COUNT(*)', 'count')
        .where('u.currentStreakDays > 0')
        .getRawOne<{ count: string }>(),
      // streaks that started/grew this month — approximated as users who were
      // last active this month and currently have a streak.
      this.users
        .createQueryBuilder('u')
        .select('COUNT(*)', 'count')
        .where('u.currentStreakDays > 0')
        .andWhere('u.lastActiveAt >= :since', { since: monthStart })
        .getRawOne<{ count: string }>(),
      this.userAchievements
        .createQueryBuilder('ua')
        .select('COUNT(*)', 'count')
        .getRawOne<{ count: string }>(),
      this.userAchievements
        .createQueryBuilder('ua')
        .select('COUNT(*)', 'count')
        .where('ua.earnedAt >= :since', { since: monthStart })
        .getRawOne<{ count: string }>(),
      this.users
        .createQueryBuilder('u')
        .select('COUNT(*)', 'count')
        .where('u.xp > 0')
        .getRawOne<{ count: string }>(),
      this.users
        .createQueryBuilder('u')
        .select('COUNT(*)', 'count')
        .where('u.createdAt >= :since', { since: monthStart })
        .andWhere('u.xp > 0')
        .getRawOne<{ count: string }>(),
      this.xpDistributionRaw(),
      this.streakOverview(monthStart),
      this.recentBadges(),
    ]);

    const totalXpEarned = Number(xpAgg?.sum ?? 0);
    const newXpThisMonth = Number(newXpThisMonthRow?.sum ?? 0);
    const activeStreaks = Number(activeStreaksRow?.count ?? 0);
    const newStreaksThisMonth = Number(newStreaksThisMonthRow?.count ?? 0);
    const badgesEarned = Number(badgesTotalRow?.count ?? 0);
    const newBadgesThisMonth = Number(newBadgesThisMonthRow?.count ?? 0);
    const usersParticipating = Number(participantsRow?.count ?? 0);
    const newParticipantsThisMonth = Number(newParticipantsThisMonthRow?.count ?? 0);

    const xpDistribution = this.formatDistribution(bucketsRaw, usersParticipating);

    return {
      totalXpEarned,
      newXpThisMonth,
      activeStreaks,
      newStreaksThisMonth,
      badgesEarned,
      newBadgesThisMonth,
      usersParticipating,
      newParticipantsThisMonth,
      xpDistribution,
      streakOverview,
      recentBadges,
    };
  }

  // Badges that have actually been earned, most-recently-awarded first, with a
  // count of how many users hold each. Drives the "Recent Badges Earned" panel.
  private async recentBadges(limit = 5): Promise<RecentBadge[]> {
    // GROUP BY the achievements PK only — Postgres lets us select the other
    // columns of the same row via functional dependency on the primary key.
    const rows = await this.userAchievements
      .createQueryBuilder('ua')
      .innerJoin('ua.achievement', 'a')
      .select('a.code', 'code')
      .addSelect('a.title', 'title')
      .addSelect('a.description', 'description')
      .addSelect('a.iconKey', 'iconKey')
      .addSelect('COUNT(*)', 'earnedByUsers')
      .addSelect('MAX(ua.earned_at)', 'lastEarnedAt')
      .groupBy('a.id')
      .orderBy('"lastEarnedAt"', 'DESC')
      .limit(limit)
      .getRawMany<{
        code: RecentBadge['code'];
        title: string;
        description: string;
        iconKey: string;
        earnedByUsers: string;
      }>();

    return rows.map((r) => ({
      code: r.code,
      title: r.title,
      description: r.description,
      iconKey: r.iconKey,
      earnedByUsers: Number(r.earnedByUsers),
    }));
  }

  private async xpDistributionRaw(): Promise<{ idx: number; count: number }[]> {
    // One scan: assign each user to a bucket index via a CASE expression, then
    // group by it. Avoids N queries when buckets grow.
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
    return rows.map((r) => ({ idx: Number(r.idx), count: Number(r.count) }));
  }

  private formatDistribution(
    raw: { idx: number; count: number }[],
    totalParticipants: number,
  ): XpDistributionBucket[] {
    const byIdx = new Map(raw.map((r) => [r.idx, r.count]));
    const denom = Math.max(1, totalParticipants);
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

  private async streakOverview(monthStart: Date): Promise<StreakOverview> {
    const [longestRow, avgRow, avgPrevRow, sevenRow, thirtyRow] = await Promise.all([
      this.users
        .createQueryBuilder('u')
        .select('COALESCE(MAX(u.longestStreakDays), 0)', 'max')
        .getRawOne<{ max: string }>(),
      this.users
        .createQueryBuilder('u')
        .select('COALESCE(AVG(u.currentStreakDays), 0)', 'avg')
        .where('u.currentStreakDays > 0')
        .getRawOne<{ avg: string }>(),
      this.users
        .createQueryBuilder('u')
        .select('COALESCE(AVG(u.currentStreakDays), 0)', 'avg')
        .where('u.currentStreakDays > 0')
        .andWhere('u.lastActiveAt < :since', { since: monthStart })
        .getRawOne<{ avg: string }>(),
      this.users
        .createQueryBuilder('u')
        .select('COUNT(*)', 'count')
        .where('u.currentStreakDays >= 7')
        .getRawOne<{ count: string }>(),
      this.users
        .createQueryBuilder('u')
        .select('COUNT(*)', 'count')
        .where('u.currentStreakDays >= 30')
        .getRawOne<{ count: string }>(),
    ]);

    const avgCurrent = Number(avgRow?.avg ?? 0);
    const avgPrev = Number(avgPrevRow?.avg ?? 0);
    return {
      longestStreakDays: Number(longestRow?.max ?? 0),
      avgStreakDays: Math.round(avgCurrent * 10) / 10,
      avgStreakChangeThisMonth: Math.round((avgCurrent - avgPrev) * 10) / 10,
      sevenDayStreakUsers: Number(sevenRow?.count ?? 0),
      thirtyDayStreakUsers: Number(thirtyRow?.count ?? 0),
    };
  }

  async topEarners(page: number, limit: number): Promise<TopXpEarnersPage> {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const offset = (safePage - 1) * safeLimit;

    const [rows, total] = await this.users
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.displayName',
        'u.email',
        'u.avatarUrl',
        'u.xp',
        'u.currentStreakDays',
      ])
      .where('u.role != :role', { role: 'admin' })
      .orderBy('u.xp', 'DESC')
      .addOrderBy('u.createdAt', 'ASC')
      .skip(offset)
      .take(safeLimit)
      .getManyAndCount();

    const items: TopXpEarner[] = rows.map((u, i) => ({
      rank: offset + i + 1,
      userId: u.id,
      displayName: u.displayName,
      email: u.email,
      avatarUrl: u.avatarUrl,
      totalXp: u.xp ?? 0,
      level: levelFromXp(u.xp ?? 0),
      currentStreakDays: u.currentStreakDays ?? 0,
    }));

    return { items, page: safePage, limit: safeLimit, total };
  }

  // ---------- XP ledger ----------
  //
  // Append-only audit row for an XP change. Call from inside the same
  // transaction that bumps users.xp so the ledger never diverges from the
  // denormalised total. Only `lesson_completion` (questions inside a level)
  // and the manual `admin_adjustment` reason are valid — achievements and
  // streaks are recognition only and never produce ledger rows.
  async recordXp(manager: EntityManager, args: RecordXpArgs): Promise<void> {
    if (!args.amount) return;
    const entry = manager.getRepository(XpLedgerEntry).create({
      userId: args.userId,
      amount: args.amount,
      reason: args.reason,
      sourceType: args.sourceType ?? null,
      sourceId: args.sourceId ?? null,
      metadata: args.metadata ?? {},
    });
    await manager.getRepository(XpLedgerEntry).save(entry);
  }

  // ---------- Awarding ----------
  //
  // Called from inside the lesson-completion transaction. Uses the passed
  // EntityManager so the insert participates in the same transaction.
  // `INSERT ... ON CONFLICT DO NOTHING` makes awarding idempotent — re-running
  // for the same user can never duplicate.
  async awardForUser(
    manager: EntityManager,
    userId: string,
    stats: { lessonsCompleted: number; xp: number; longestStreakDays: number },
  ): Promise<Achievement[]> {
    const catalog = await manager.getRepository(Achievement).find();
    const eligible = catalog.filter((a) => {
      switch (a.kind) {
        case 'lessons_completed':
          return stats.lessonsCompleted >= a.threshold;
        case 'xp_total':
          return stats.xp >= a.threshold;
        case 'streak_days':
          return stats.longestStreakDays >= a.threshold;
        default:
          return false;
      }
    });
    if (eligible.length === 0) return [];

    // Single multi-row insert; ON CONFLICT skips already-earned rows. RETURNING
    // yields only the rows actually inserted, so the caller learns exactly
    // which achievements are newly unlocked (for push notifications, etc.).
    const values = eligible.map((_, i) => `($1, $${i + 2})`).join(', ');
    const params = [userId, ...eligible.map((a) => a.id)];
    const inserted: Array<{ achievement_id: string }> = await manager.query(
      `INSERT INTO user_achievements ("user_id", "achievement_id") VALUES ${values}
       ON CONFLICT ("user_id", "achievement_id") DO NOTHING
       RETURNING "achievement_id"`,
      params,
    );
    const newIds = new Set(inserted.map((r) => r.achievement_id));
    return eligible.filter((a) => newIds.has(a.id));
  }
}
