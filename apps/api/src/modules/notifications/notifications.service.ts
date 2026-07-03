import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NOTIFICATION_TYPE_CHANNEL,
  type NotificationData,
  type NotificationType,
} from '@lexiroot/shared';
import { UserSettings } from '../settings/entities/user-settings.entity';
import { NotificationOutbox } from './entities/notification-outbox.entity';

/** Which settings toggle gates each server-driven notification type. */
const SETTING_KEY_FOR_TYPE: Record<NotificationType, keyof UserSettings> = {
  achievement_unlocked: 'achievementAlerts',
  cultural_content_published: 'culturalContentAlert',
  streak_reminder: 'streakReminder',
  lesson_available: 'culturalContentAlert',
};

export interface EnqueueInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Omit<NotificationData, 'type'>;
  /** Idempotency key; a duplicate enqueue is silently ignored. */
  dedupeKey?: string;
  /** When to deliver (default: immediately). */
  scheduledAt?: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationOutbox)
    private readonly outbox: Repository<NotificationOutbox>,
    @InjectRepository(UserSettings)
    private readonly settings: Repository<UserSettings>,
  ) {}

  /**
   * Queue a push for a single user, honouring their notification settings.
   * Returns true if a row was enqueued, false if suppressed (toggle off) or
   * de-duplicated. Safe to call from inside request handlers — the actual
   * send happens out-of-band in the outbox worker.
   */
  async enqueue(input: EnqueueInput): Promise<boolean> {
    const allowed = await this.isTypeEnabled(input.userId, input.type);
    if (!allowed) return false;

    const res = await this.outbox
      .createQueryBuilder()
      .insert()
      .into(NotificationOutbox)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: { type: input.type, ...input.data },
        channelId: NOTIFICATION_TYPE_CHANNEL[input.type],
        dedupeKey: input.dedupeKey ?? null,
        scheduledAt: input.scheduledAt ?? new Date(),
      })
      // ON CONFLICT DO NOTHING against the unique dedupe_key.
      .orIgnore()
      .execute();

    return (res.identifiers?.length ?? 0) > 0;
  }

  /**
   * Fan a single event out to every user whose relevant toggle is on. Used for
   * broadcasts like "new cultural content". Each row gets a per-user dedupe key
   * so re-publishing the same content never double-sends.
   */
  async enqueueBroadcast(
    type: NotificationType,
    payload: { title: string; body: string; data?: Omit<NotificationData, 'type'>; dedupeKey: string },
  ): Promise<number> {
    const settingKey = SETTING_KEY_FOR_TYPE[type];
    const recipients = await this.settings
      .createQueryBuilder('s')
      .select('s.user_id', 'userId')
      .where(`s.${this.columnFor(settingKey)} = true`)
      .getRawMany<{ userId: string }>();

    let enqueued = 0;
    for (const { userId } of recipients) {
      const ok = await this.enqueue({
        userId,
        type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        dedupeKey: `${payload.dedupeKey}:${userId}`,
      });
      if (ok) enqueued++;
    }
    this.logger.log(`Broadcast ${type}: enqueued ${enqueued}/${recipients.length}`);
    return enqueued;
  }

  private async isTypeEnabled(userId: string, type: NotificationType): Promise<boolean> {
    const row = await this.settings.findOne({ where: { userId } });
    if (!row) return false; // no settings row => defaults are all off (opt-in)
    return Boolean(row[SETTING_KEY_FOR_TYPE[type]]);
  }

  /** Maps a UserSettings entity property to its snake_case column name. */
  private columnFor(key: keyof UserSettings): string {
    return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  }
}
