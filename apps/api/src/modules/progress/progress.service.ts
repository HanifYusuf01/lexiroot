import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  LEARNING_LEVELS,
  nextLearningLevel,
  type RpActivity,
  type LanguageCode,
  type LearningLevel,
  type LessonProgressState,
} from '@lexiroot/shared';
import { GamificationService } from '../gamification/gamification.service';
import { LeaderboardService } from '../gamification/leaderboard.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Lesson } from '../lessons/entities/lesson.entity';
import {
  LessonAccessService,
  type LessonViewer,
} from '../payments/lesson-access.service';
import { User } from '../users/entities/user.entity';
import { UpsertLessonProgressDto } from './dto/upsert-lesson-progress.dto';
import { LessonCompletion } from './entities/lesson-completion.entity';
import { LessonProgress } from './entities/lesson-progress.entity';

export interface ProgressSummary {
  streak: number;
  totalXp: number;
  lessonsCompleted: number;
  completedLessonIds: string[];
}

/**
 * Distinct lessons one account may complete for the first time in 24 hours.
 *
 * The server cannot prove a lesson was actually played: `correctCount` is the
 * learner's own claim, and the practice flow records no intermediate progress
 * to check it against. What it can do is bound the damage. A person studying
 * hard finishes a handful of lessons a day — someone returning from a day
 * offline flushes maybe a dozen queued completions at once — while a script
 * farming the whole catalogue for XP, achievements and tier promotions needs
 * hundreds in a burst. Set far above real use, so it can only ever catch the
 * second kind.
 */
const MAX_NEW_COMPLETIONS_PER_DAY = 60;

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/**
 * The tier to promote a learner into, or null to leave them where they are.
 *
 * Walks forward from their current tier while each one is finished, so a
 * learner who clears several tiers in one go (or whose earlier tiers were
 * completed before promotion existed) lands on the first unfinished one rather
 * than advancing a single step per lesson.
 */
function nextTierFor(
  current: LearningLevel | null,
  completedTiers: LearningLevel[],
): LearningLevel | null {
  const done = new Set(completedTiers);
  let tier: LearningLevel = current ?? LEARNING_LEVELS[0];
  let promotedTo: LearningLevel | null = null;
  while (done.has(tier)) {
    const next = nextLearningLevel(tier);
    // Top tier finished — there is nowhere left to promote to.
    if (!next) break;
    promotedTo = next;
    tier = next;
  }
  return promotedTo;
}

function isPrevUtcDay(prev: Date, today: Date): boolean {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diff = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) -
    Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate());
  return diff === oneDayMs;
}

function toProgressState(row: LessonProgress): LessonProgressState {
  return {
    tier: row.tier,
    level: row.level,
    subIdx: row.subIdx,
    subLessonId: row.subLessonId,
    stepKind: row.stepKind,
    stepIndex: row.stepIndex,
    correctCount: row.correctCount,
    xp: row.xp,
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(LessonCompletion)
    private readonly completions: Repository<LessonCompletion>,
    @InjectRepository(LessonProgress)
    private readonly progress: Repository<LessonProgress>,
    @InjectRepository(Lesson)
    private readonly lessons: Repository<Lesson>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly gamification: GamificationService,
    private readonly notifications: NotificationsService,
    private readonly access: LessonAccessService,
    private readonly leaderboard: LeaderboardService,
  ) {}

  async getActiveProgress(userId: string): Promise<LessonProgressState | null> {
    const row = await this.progress.findOne({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
    return row ? toProgressState(row) : null;
  }

  async upsertProgress(
    userId: string,
    dto: UpsertLessonProgressDto,
  ): Promise<LessonProgressState> {
    const existing = await this.progress.findOne({
      where: { userId, tier: dto.tier, level: dto.level },
    });
    const row = existing
      ? await this.progress.save({
          ...existing,
          subIdx: dto.subIdx,
          subLessonId: dto.subLessonId ?? null,
          stepKind: dto.stepKind,
          stepIndex: dto.stepIndex,
          correctCount: dto.correctCount,
          xp: dto.xp,
        })
      : await this.progress.save({
          userId,
          tier: dto.tier,
          level: dto.level,
          subIdx: dto.subIdx,
          subLessonId: dto.subLessonId ?? null,
          stepKind: dto.stepKind,
          stepIndex: dto.stepIndex,
          correctCount: dto.correctCount,
          xp: dto.xp,
        });
    return toProgressState(row);
  }

  async clearProgress(userId: string, tier: string, level: number): Promise<void> {
    await this.progress.delete({ userId, tier, level });
  }

  async summary(userId: string): Promise<ProgressSummary> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const rows = await this.completions.find({
      where: { userId },
      select: ['lessonId'],
    });
    return {
      streak: user.currentStreakDays ?? 0,
      totalXp: user.xp ?? 0,
      lessonsCompleted: user.lessonsCompleted ?? 0,
      completedLessonIds: rows.map((r) => r.lessonId),
    };
  }

  /**
   * Tiers in which the user has completed every published lesson.
   *
   * Scoped to the language they're learning: finishing Beginner Yoruba
   * shouldn't wait on Beginner lessons in a language they never picked. Drafts
   * and archived lessons are excluded — unpublished content must never gate
   * progression. A tier with no published lessons counts as complete for
   * nobody, hence the `total > 0` guard.
   */
  private async completedTiers(
    manager: EntityManager,
    userId: string,
    language: LanguageCode | null,
  ): Promise<LearningLevel[]> {
    const rows: Array<{ tier: LearningLevel; total: string; done: string }> = await manager.query(
      `SELECT l."tier" AS tier,
              COUNT(*) AS total,
              COUNT(lc."id") AS done
         FROM "lessons" l
         LEFT JOIN "lesson_completions" lc
           ON lc."lesson_id" = l."id" AND lc."user_id" = $1
        WHERE l."status" = 'published'
          AND ($2::varchar IS NULL OR l."language" = $2)
        GROUP BY l."tier"`,
      [userId, language],
    );
    return rows
      .filter((r) => Number(r.total) > 0 && Number(r.done) === Number(r.total))
      .map((r) => r.tier);
  }

  async completeLesson(
    viewer: LessonViewer,
    lessonId: string,
    correctCount: number,
    totalCount: number,
  ): Promise<{ completion: LessonCompletion; xpAwarded: number; streak: number; totalXp: number }> {
    const userId = viewer.id;
    // Both numbers come from the client and are stored on the completion, so
    // they have to be coherent. The comparison used to be guarded by
    // `totalCount > 0`, which let "0 of 0 correct, 50 right" through unchecked.
    // Zero totals stay legal — a study-only sub-lesson has entries to read and
    // no questions to answer, and it still completes.
    if (totalCount < 0 || correctCount < 0) {
      throw new BadRequestException('Counts cannot be negative');
    }
    if (correctCount > totalCount) {
      throw new BadRequestException('correctCount cannot exceed totalCount');
    }
    const lesson = await this.lessons.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Reading a paid lesson is gated; banking its XP has to be too. Gating only
    // the content left a free account able to complete every premium lesson it
    // could not open — collecting the XP, the achievements and the tier
    // promotion that come with them.
    await this.access.assertCanRead(lesson, viewer);

    // `totalCount` is the learner's own claim about how many questions they
    // answered. It cannot be trusted as proof of work, but it can at least be
    // held to the lesson that actually exists — a claim of more answers than
    // there are exercises is incoherent on its face.
    const [counted] = (await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM "exercises" WHERE "lesson_id" = $1`,
      [lessonId],
    )) as Array<{ total: number }>;
    if (totalCount > (counted?.total ?? 0)) {
      throw new BadRequestException('totalCount exceeds the number of exercises in this lesson');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const existing = await manager
        .getRepository(LessonCompletion)
        .findOne({ where: { userId, lessonId } });

      // The day they last *learned*, read before this completion is written.
      //
      // `lastActiveAt` cannot answer this: LastActiveInterceptor bumps it on
      // every authenticated request, so by the time a lesson is completed it
      // already says today, and a streak measured against it can never
      // increment. Completions are the only durable record of study.
      const [previous] = (await manager.query(
        `SELECT MAX("completed_at") AS last FROM "lesson_completions" WHERE "user_id" = $1`,
        [userId],
      )) as Array<{ last: Date | string | null }>;
      const lastLearned = previous?.last ? new Date(previous.last) : null;

      // Only first-time completions are capped. Replaying one — which the
      // offline outbox does on reconnect — must stay idempotent and is never
      // refused, since it banks nothing new.
      if (!existing) {
        const [burst] = (await manager.query(
          `SELECT COUNT(*)::int AS recent FROM "lesson_completions"
            WHERE "user_id" = $1 AND "completed_at" >= now() - interval '24 hours'`,
          [userId],
        )) as Array<{ recent: number }>;
        if ((burst?.recent ?? 0) >= MAX_NEW_COMPLETIONS_PER_DAY) {
          throw new BadRequestException(
            'You have completed an unusual number of lessons today. Try again tomorrow.',
          );
        }
      }

      // Root Points, decided here and never by the client.
      //
      // A first pass earns the configured rate in full; a review earns a
      // fraction of it, shrinking with each repeat until it earns nothing. That
      // is the anti-farming rule: revisiting a lesson is worth encouraging,
      // replaying the easiest one for rank is not. Rates and the ladder are
      // admin-configurable, so the balance can be tuned without a release.
      const priorCompletions = existing?.attempts ?? 0;
      const activity: RpActivity = existing ? 'lesson_review' : 'lesson_completion';
      const baseRate = await this.leaderboard.rateFor(activity);
      const multiplier = await this.leaderboard.repeatMultiplier(priorCompletions);
      const xpAwarded = Math.round(baseRate * multiplier);

      const completion = existing
        ? await manager.getRepository(LessonCompletion).save({
            ...existing,
            correctCount,
            totalCount,
            attempts: priorCompletions + 1,
            xpEarned: existing.xpEarned + xpAwarded,
          })
        : await manager.getRepository(LessonCompletion).save({
            userId,
            lessonId,
            correctCount,
            totalCount,
            attempts: 1,
            xpEarned: xpAwarded,
          });

      const user = await manager.getRepository(User).findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const now = new Date();
      let streak = user.currentStreakDays ?? 0;
      if (!lastLearned) {
        // First lesson ever — day one.
        streak = 1;
      } else if (isSameUtcDay(lastLearned, now)) {
        // Already studied today; the streak is banked. A second lesson does not
        // count twice, and a learner who has never had a streak still gets one.
        if (streak === 0) streak = 1;
      } else if (isPrevUtcDay(lastLearned, now)) {
        streak = streak + 1;
      } else {
        // A day was missed — start again at today.
        streak = 1;
      }

      user.xp = (user.xp ?? 0) + xpAwarded;
      user.currentStreakDays = streak;
      user.longestStreakDays = Math.max(user.longestStreakDays ?? 0, streak);
      if (!existing) user.lessonsCompleted = (user.lessonsCompleted ?? 0) + 1;
      user.lastActiveAt = now;
      await manager.getRepository(User).save(user);

      if (xpAwarded > 0) {
        await this.gamification.recordXp(manager, {
          userId,
          amount: xpAwarded,
          reason: activity,
          sourceType: 'lesson',
          sourceId: lessonId,
          // Kept so a standing can always be explained after the fact — which
          // rate applied, and how much a repeat discounted it.
          metadata: { correctCount, totalCount, attempt: priorCompletions + 1, baseRate, multiplier },
        });
      }

      // Tier standing is derived from lesson completion, never from the
      // onboarding answer — that was only ever a starting guess.
      const completedTiers = await this.completedTiers(manager, userId, user.language);

      // Promote out of a finished tier so the learner is served the next one
      // (the levels screen reads `user.level` to decide which tier to show).
      // Only ever forward: a re-completed lesson must not demote anyone.
      const promotedTo = nextTierFor(user.level, completedTiers);
      if (promotedTo) {
        user.level = promotedTo;
        await manager.getRepository(User).save(user);
      }

      const newAchievements = await this.gamification.awardForUser(manager, userId, {
        lessonsCompleted: user.lessonsCompleted ?? 0,
        xp: user.xp ?? 0,
        longestStreakDays: user.longestStreakDays ?? 0,
        completedTiers,
      });

      return { completion, xpAwarded, streak, totalXp: user.xp, newAchievements };
    });

    // Enqueue achievement pushes only after the transaction commits, so we
    // never notify for an unlock that got rolled back. Enqueue itself honours
    // the user's achievementAlerts toggle and is idempotent per achievement.
    for (const achievement of result.newAchievements) {
      await this.notifications.enqueue({
        userId,
        type: 'achievement_unlocked',
        title: 'Achievement unlocked! 🏆',
        body: `You earned "${achievement.title}".`,
        data: { route: '/achievements' },
        dedupeKey: `achievement:${userId}:${achievement.id}`,
      });
    }

    const { completion, xpAwarded, streak, totalXp } = result;
    return { completion, xpAwarded, streak, totalXp };
  }
}
