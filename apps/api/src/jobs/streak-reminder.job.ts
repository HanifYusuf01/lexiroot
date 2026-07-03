import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotificationsService } from '../modules/notifications/notifications.service';

interface AtRiskUser {
  id: string;
  current_streak_days: number;
}

/**
 * Server-driven "don't lose your streak" nudge. Targets learners who kept a
 * streak yesterday but haven't practised today, so it's about to break. The
 * local daily reminder is the primary nudge; this is the safety net for people
 * who dismissed it. Enqueue is idempotent per user per day via the dedupe key.
 *
 * NOTE: fires on a UTC evening for now. Per-timezone quiet-hours targeting
 * (using each device's stored IANA zone) is a follow-up — the outbox already
 * carries the machinery (scheduled_at) to support it.
 */
@Injectable()
export class StreakReminderJob {
  private readonly logger = new Logger(StreakReminderJob.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async run(): Promise<void> {
    const atRisk: AtRiskUser[] = await this.dataSource.query(
      `SELECT u."id", u."current_streak_days"
         FROM "users" u
         JOIN "user_settings" s ON s."user_id" = u."id"
        WHERE u."role" = 'user'
          AND s."streak_reminder" = true
          AND u."current_streak_days" > 0
          AND u."last_active_at" >= date_trunc('day', now()) - interval '1 day'
          AND u."last_active_at" < date_trunc('day', now())`,
    );

    const day = new Date().toISOString().slice(0, 10);
    let enqueued = 0;
    for (const user of atRisk) {
      const ok = await this.notifications.enqueue({
        userId: user.id,
        type: 'streak_reminder',
        title: 'Keep your streak alive! 🔥',
        body: `You're on a ${user.current_streak_days}-day streak. Practise now so you don't lose it.`,
        data: { route: '/(tabs)' },
        dedupeKey: `streak:${user.id}:${day}`,
      });
      if (ok) enqueued++;
    }
    this.logger.log(`Streak reminders: enqueued ${enqueued}/${atRisk.length}`);
  }
}
