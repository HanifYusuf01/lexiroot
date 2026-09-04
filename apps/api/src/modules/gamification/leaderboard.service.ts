import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DEFAULT_LEAGUE_CONFIG,
  DEFAULT_RP_RATES,
  DEFAULT_RP_REPEAT_MULTIPLIERS,
  type FamilyLeaderboardResponse,
  type FriendsLeaderboardResponse,
  type LanguageCode,
  type League,
  type LeaderboardMe,
  type LeaderboardPeriod,
  type LeaderboardQuery,
  type LeaderboardResponse,
  type LeaderboardRow,
  type LearningLevel,
  type RpActivity,
} from '@lexiroot/shared';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { User } from '../users/entities/user.entity';
import { LeaderboardSnapshot } from './entities/leaderboard-snapshot.entity';

/** RP totals a learner works towards within a week. */
const MILESTONES = [100, 250, 500, 900, 1500, 2500, 4000, 6000];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The Monday 00:00 UTC starting the week that contains `at`.
 *
 * UTC throughout, deliberately: the reset must happen at one instant for
 * everyone. Anchored to local time, two learners would see different standings
 * for the same moment and the countdown would disagree with the actual cut.
 */
export function weekStart(at: Date = new Date()): Date {
  const d = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
  // getUTCDay: 0 = Sunday. Shift so Monday is 0.
  const offset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d;
}

/** ISO-8601 week number, for the "Week 20" header. */
function isoWeekNumber(monday: Date): number {
  const thursday = new Date(monday);
  thursday.setUTCDate(thursday.getUTCDate() + 3);
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const offset = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - offset + 3);
  return 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface RankedRow {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rootPoints: number;
  currentStreakDays: number;
}

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(LeaderboardSnapshot)
    private readonly snapshots: Repository<LeaderboardSnapshot>,
    private readonly platformSettings: PlatformSettingsService,
  ) {}

  // ---------- Root Point values (admin-configurable) ----------

  /**
   * RP for one activity. Admin-set values win; anything unset falls back to the
   * shipped default, so an activity added in code never silently pays zero.
   */
  async rateFor(activity: RpActivity): Promise<number> {
    const settings = await this.platformSettings.getCached();
    const configured = settings.rpRates?.[activity];
    return typeof configured === 'number' ? configured : DEFAULT_RP_RATES[activity];
  }

  /**
   * The fraction of full RP a repeat earns, given how many times the learner
   * has already completed it. Past the end of the ladder a repeat is worth
   * nothing — reviewing is worth encouraging, grinding one easy lesson is not.
   */
  async repeatMultiplier(priorCompletions: number): Promise<number> {
    const settings = await this.platformSettings.getCached();
    const ladder =
      Array.isArray(settings.rpRepeatMultipliers) && settings.rpRepeatMultipliers.length > 0
        ? settings.rpRepeatMultipliers
        : [...DEFAULT_RP_REPEAT_MULTIPLIERS];
    const index = Math.min(Math.max(priorCompletions, 0), ladder.length - 1);
    const value = Number(ladder[index]);
    return Number.isFinite(value) ? value : 0;
  }

  // ---------- Period ----------

  period(at: Date = new Date()): LeaderboardPeriod {
    const start = weekStart(at);
    const nextStart = new Date(start.getTime() + 7 * DAY_MS);
    return {
      startsOn: ymd(start),
      endsOn: ymd(new Date(nextStart.getTime() - DAY_MS)),
      weekNumber: isoWeekNumber(start),
      resetsInMs: Math.max(0, nextStart.getTime() - at.getTime()),
    };
  }

  // ---------- Public board ----------

  async board(userId: string, query: LeaderboardQuery): Promise<LeaderboardResponse> {
    const me = await this.users.findOne({ where: { id: userId } });
    const start = weekStart();

    // Filters default to the caller's own grouping — the board they belong to
    // is the one they should land on.
    const language = (query.language ?? me?.language ?? null) as LanguageCode | null;
    const level = (query.level ?? me?.level ?? null) as LearningLevel | null;
    const league = (query.league ?? me?.league ?? 'bronze') as League;
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const ranked = await this.rankedForGroup(start, { language, level, league });

    return {
      period: this.period(),
      league,
      language,
      level,
      rows: ranked.slice(0, limit).map((r, i) => this.toRow(r, i + 1, userId)),
      me: await this.myStanding(userId, ranked, start),
    };
  }

  /**
   * One league/language/level group, ordered by RP earned this week.
   *
   * Summed from the ledger rather than a stored total: RP is only ever written
   * as ledger rows, so summing them is the one definition that cannot drift
   * from what was actually awarded.
   */
  private async rankedForGroup(
    start: Date,
    group: { language: LanguageCode | null; level: LearningLevel | null; league: League },
  ): Promise<RankedRow[]> {
    const params: unknown[] = [ymd(start), group.league];
    let filters = '';
    if (group.language) {
      params.push(group.language);
      filters += ` AND u."language" = $${params.length}`;
    }
    if (group.level) {
      params.push(group.level);
      filters += ` AND u."level" = $${params.length}`;
    }

    return (await this.users.manager.query(
      `SELECT u."id" AS "userId",
              u."display_name" AS "displayName",
              u."avatar_url" AS "avatarUrl",
              u."current_streak_days" AS "currentStreakDays",
              COALESCE(SUM(x."amount"), 0)::int AS "rootPoints"
         FROM "users" u
         JOIN "xp_ledger" x
           ON x."user_id" = u."id" AND x."created_at" >= $1::date
        WHERE u."role" = 'user'
          AND u."deleted_at" IS NULL
          AND u."leaderboard_opt_out" = false
          AND u."league" = $2${filters}
        GROUP BY u."id"
       HAVING COALESCE(SUM(x."amount"), 0) > 0
        ORDER BY "rootPoints" DESC, u."created_at" ASC`,
      params,
    )) as RankedRow[];
  }

  private toRow(r: RankedRow, rank: number, meId: string): LeaderboardRow {
    return {
      rank,
      userId: r.userId,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      rootPoints: Number(r.rootPoints),
      currentStreakDays: Number(r.currentStreakDays ?? 0),
      isMe: r.userId === meId,
    };
  }

  // ---------- The caller's own standing ----------

  private async myStanding(
    userId: string,
    ranked: RankedRow[],
    start: Date,
  ): Promise<LeaderboardMe> {
    const user = await this.users.findOne({ where: { id: userId } });
    const index = ranked.findIndex((r) => r.userId === userId);
    const rank = index >= 0 ? index + 1 : null;

    const [totals] = (await this.users.manager.query(
      `SELECT COALESCE(SUM(x."amount"), 0)::int AS "rootPoints"
         FROM "xp_ledger" x
        WHERE x."user_id" = $1 AND x."created_at" >= $2::date`,
      [userId, ymd(start)],
    )) as Array<{ rootPoints: number }>;

    const [work] = (await this.users.manager.query(
      `SELECT COUNT(*)::int AS "lessons",
              COALESCE(SUM(c."correct_count"), 0)::int AS "correct",
              COALESCE(SUM(c."total_count"), 0)::int AS "answered"
         FROM "lesson_completions" c
        WHERE c."user_id" = $1 AND c."completed_at" >= $2::date`,
      [userId, ymd(start)],
    )) as Array<{ lessons: number; correct: number; answered: number }>;

    const previous = await this.previousRank(userId, start);
    const rootPoints = Number(totals?.rootPoints ?? 0);
    const nextMilestone = MILESTONES.find((m) => m > rootPoints) ?? null;

    return {
      rank,
      previousRank: previous,
      // A better rank is a smaller number, so improving means the delta is
      // positive — "up 3 places" is last week's 11 minus this week's 8.
      rankDelta: rank !== null && previous !== null ? previous - rank : null,
      rootPoints,
      lessonsCompleted: Number(work?.lessons ?? 0),
      masteryScore:
        work && work.answered > 0 ? Math.round((work.correct / work.answered) * 100) : 0,
      currentStreakDays: user?.currentStreakDays ?? 0,
      league: (user?.league ?? 'bronze') as League,
      nextMilestone,
      rpToNextMilestone: nextMilestone !== null ? nextMilestone - rootPoints : null,
      optedOut: user?.leaderboardOptOut ?? false,
    };
  }

  /** Their rank in the week before `start`, from the settled snapshot. */
  private async previousRank(userId: string, start: Date): Promise<number | null> {
    const row = await this.snapshots.findOne({
      where: { userId, periodStart: ymd(new Date(start.getTime() - 7 * DAY_MS)) },
    });
    return row?.rank ?? null;
  }

  /** Leave or rejoin public rankings. RP keeps accruing either way. */
  async setOptOut(userId: string, optedOut: boolean): Promise<{ optedOut: boolean }> {
    await this.users.update(userId, { leaderboardOptOut: optedOut });
    return { optedOut };
  }

  // ---------- Family board ----------

  /**
   * Everyone on the caller's family plan, ranked together.
   *
   * No language, level or league filter: a household competes as a household,
   * and splitting it across leagues would defeat the point. Opting out of the
   * *public* leaderboard doesn't hide someone here — this is their own family,
   * not strangers.
   */
  async familyBoard(userId: string): Promise<FamilyLeaderboardResponse> {
    const start = weekStart();

    const members = (await this.users.manager.query(
      `WITH plan AS (
         SELECT s."id"
           FROM "subscriptions" s
           JOIN "subscription_plans" p ON p."id" = s."plan_id"
          WHERE p."features" @> '["family_sharing"]'::jsonb
            AND (s."current_period_end" IS NULL OR s."current_period_end" > now())
            AND (
              s."user_id" = $1
              OR EXISTS (
                SELECT 1 FROM "subscription_members" m
                 WHERE m."subscription_id" = s."id" AND m."user_id" = $1
                   AND m."accepted_at" IS NOT NULL AND m."revoked_at" IS NULL
              )
            )
          LIMIT 1
       ),
       people AS (
         SELECT s."user_id" AS "user_id" FROM "subscriptions" s JOIN plan ON plan."id" = s."id"
         UNION
         SELECT m."user_id" FROM "subscription_members" m
           JOIN plan ON plan."id" = m."subscription_id"
          WHERE m."accepted_at" IS NOT NULL AND m."revoked_at" IS NULL AND m."user_id" IS NOT NULL
       )
       SELECT u."id" AS "userId",
              u."display_name" AS "displayName",
              u."avatar_url" AS "avatarUrl",
              u."current_streak_days" AS "currentStreakDays",
              COALESCE(SUM(x."amount") FILTER (WHERE x."created_at" >= $2::date), 0)::int
                AS "rootPoints"
         FROM people
         JOIN "users" u ON u."id" = people."user_id" AND u."deleted_at" IS NULL
         LEFT JOIN "xp_ledger" x ON x."user_id" = u."id"
        GROUP BY u."id"
        ORDER BY "rootPoints" DESC, u."created_at" ASC`,
      [userId, ymd(start)],
    )) as RankedRow[];

    return {
      period: this.period(),
      enabled: members.length > 0,
      rows: members.map((r, i) => this.toRow(r, i + 1, userId)),
    };
  }

  /**
   * The caller and everyone they are friends with, ranked together.
   *
   * No league, language or level split — you chose these people, and splitting
   * them across boards would defeat the point. Unlike the family board this one
   * honours the public opt-out: a family is your household, whereas a friends
   * list is closer to a public setting, and someone who asked to be hidden
   * should stay hidden.
   */
  async friendsBoard(userId: string): Promise<FriendsLeaderboardResponse> {
    const start = weekStart();

    const rows = (await this.users.manager.query(
      `WITH people AS (
         SELECT $1::uuid AS "user_id"
         UNION
         SELECT f."friend_id" FROM "friendships" f WHERE f."user_id" = $1
       )
       SELECT u."id" AS "userId",
              u."display_name" AS "displayName",
              u."avatar_url" AS "avatarUrl",
              u."current_streak_days" AS "currentStreakDays",
              COALESCE(SUM(x."amount") FILTER (WHERE x."created_at" >= $2::date), 0)::int
                AS "rootPoints"
         FROM people
         JOIN "users" u
           ON u."id" = people."user_id"
          AND u."deleted_at" IS NULL
          AND (u."leaderboard_opt_out" = false OR u."id" = $1)
         LEFT JOIN "xp_ledger" x ON x."user_id" = u."id"
        GROUP BY u."id"
        ORDER BY "rootPoints" DESC, u."created_at" ASC`,
      [userId, ymd(start)],
    )) as RankedRow[];

    return {
      period: this.period(),
      // One row means the caller alone — a board of one isn't a competition.
      enabled: rows.length > 1,
      rows: rows.map((r, i) => this.toRow(r, i + 1, userId)),
    };
  }

  // ---------- Weekly rollover ----------

  /**
   * Settle the week that just ended: snapshot every ranking, then promote and
   * demote.
   *
   * Guarded on the closed week already having snapshots, because a job that
   * fires twice must not move anyone two leagues.
   */
  async rollOver(now: Date = new Date()): Promise<{ settled: number }> {
    const currentStart = weekStart(now);
    const closedStart = new Date(currentStart.getTime() - 7 * DAY_MS);
    const already = await this.snapshots.count({ where: { periodStart: ymd(closedStart) } });
    if (already > 0) return { settled: 0 };

    const settings = await this.platformSettings.getCached();
    const config = { ...DEFAULT_LEAGUE_CONFIG, ...(settings.leagueConfig ?? {}) };

    const rows = (await this.users.manager.query(
      `SELECT u."id" AS "userId", u."language", u."level", u."league",
              COALESCE(SUM(x."amount"), 0)::int AS "rootPoints"
         FROM "users" u
         JOIN "xp_ledger" x
           ON x."user_id" = u."id"
          AND x."created_at" >= $1::date
          AND x."created_at" < $2::date
        WHERE u."role" = 'user' AND u."deleted_at" IS NULL
        GROUP BY u."id"
       HAVING COALESCE(SUM(x."amount"), 0) >= $3
        ORDER BY u."league", u."language", u."level", "rootPoints" DESC`,
      [ymd(closedStart), ymd(currentStart), config.minWeeklyRp],
    )) as Array<{
      userId: string;
      language: LanguageCode | null;
      level: LearningLevel | null;
      league: League;
      rootPoints: number;
    }>;

    // Ranked within each group exactly as the board displays it, so "last week"
    // matches the table the learner was actually looking at.
    const groups = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = `${row.league}|${row.language ?? ''}|${row.level ?? ''}`;
      const list = groups.get(key) ?? [];
      list.push(row);
      groups.set(key, list);
    }

    let settled = 0;
    for (const list of groups.values()) {
      for (let i = 0; i < list.length; i++) {
        const row = list[i];
        const rank = i + 1;
        await this.snapshots.save(
          this.snapshots.create({
            userId: row.userId,
            periodStart: ymd(closedStart),
            language: row.language,
            level: row.level,
            league: row.league,
            rootPoints: row.rootPoints,
            rank,
          }),
        );
        settled++;

        const moved = this.leagueAfter(row.league, rank, list.length, config);
        if (moved !== row.league) await this.users.update(row.userId, { league: moved });
      }
    }
    return { settled };
  }

  private leagueAfter(
    league: League,
    rank: number,
    groupSize: number,
    config: { promoteTop: number; demoteBottom: number },
  ): League {
    const order: League[] = ['bronze', 'silver', 'gold', 'platinum'];
    const index = order.indexOf(league);
    if (rank <= config.promoteTop && index < order.length - 1) return order[index + 1];
    if (rank > groupSize - config.demoteBottom && index > 0) return order[index - 1];
    return league;
  }
}
