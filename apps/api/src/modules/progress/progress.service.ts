import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  LEARNING_LEVELS,
  nextLearningLevel,
  type LanguageCode,
  type LearningLevel,
  type LessonProgressState,
} from '@lexiroot/shared';
import { GamificationService } from '../gamification/gamification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Lesson } from '../lessons/entities/lesson.entity';
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
    userId: string,
    lessonId: string,
    correctCount: number,
    totalCount: number,
  ): Promise<{ completion: LessonCompletion; xpAwarded: number; streak: number; totalXp: number }> {
    if (totalCount > 0 && correctCount > totalCount) {
      throw new BadRequestException('correctCount cannot exceed totalCount');
    }
    const lesson = await this.lessons.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const result = await this.dataSource.transaction(async (manager) => {
      const existing = await manager
        .getRepository(LessonCompletion)
        .findOne({ where: { userId, lessonId } });

      const xpAwarded = existing ? 0 : lesson.xpReward ?? 0;
      const completion = existing
        ? await manager.getRepository(LessonCompletion).save({
            ...existing,
            correctCount,
            totalCount,
          })
        : await manager.getRepository(LessonCompletion).save({
            userId,
            lessonId,
            correctCount,
            totalCount,
            xpEarned: xpAwarded,
          });

      const user = await manager.getRepository(User).findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const now = new Date();
      const last = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
      let streak = user.currentStreakDays ?? 0;
      if (!last) {
        streak = 1;
      } else if (isSameUtcDay(last, now)) {
        // same day — no change
      } else if (isPrevUtcDay(last, now)) {
        streak = streak + 1;
      } else {
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
          reason: 'lesson_completion',
          sourceType: 'lesson',
          sourceId: lessonId,
          metadata: { correctCount, totalCount },
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
