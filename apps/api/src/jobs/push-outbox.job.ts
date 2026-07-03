import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { ExpoPushMessage } from 'expo-server-sdk';
import type { NotificationData } from '@lexiroot/shared';
import { PushSenderService } from '../modules/notifications/push-sender.service';

interface ClaimedOutbox {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: NotificationData;
  channel_id: string;
  attempts: number;
}

interface DeviceRow {
  id: string;
  expo_token: string;
}

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 100;
/** Reminders/content are worthless if stale — let Expo drop them after a day. */
const DEFAULT_TTL_SECONDS = 24 * 60 * 60;

/**
 * Drains the notification outbox. Every tick it atomically claims a batch of
 * due rows with `FOR UPDATE SKIP LOCKED` (so multiple instances never grab the
 * same row), fans each out to the recipient's enabled devices via Expo, and
 * records a delivery per device with the returned ticket id. Transient send
 * failures are re-queued with exponential backoff up to MAX_ATTEMPTS.
 */
@Injectable()
export class PushOutboxJob {
  private readonly logger = new Logger(PushOutboxJob.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly sender: PushSenderService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async run(): Promise<void> {
    const claimed = await this.claimBatch();
    if (claimed.length === 0) return;

    let sent = 0;
    for (const row of claimed) {
      try {
        const delivered = await this.deliver(row);
        if (delivered) sent++;
      } catch (err) {
        await this.requeue(row, err);
      }
    }
    this.logger.log(`Outbox: processed ${claimed.length}, delivered ${sent}`);
  }

  /**
   * Atomically move up to BATCH_SIZE due rows from `pending` to `processing`
   * and return them. SKIP LOCKED lets concurrent workers make progress without
   * blocking on each other's claimed rows.
   */
  private claimBatch(): Promise<ClaimedOutbox[]> {
    return this.dataSource.query(
      `UPDATE "notification_outbox" SET "status" = 'processing', "updated_at" = now()
        WHERE "id" IN (
          SELECT "id" FROM "notification_outbox"
           WHERE "status" = 'pending' AND "scheduled_at" <= now()
           ORDER BY "scheduled_at"
           LIMIT $1
           FOR UPDATE SKIP LOCKED
        )
      RETURNING "id", "user_id", "title", "body", "data", "channel_id", "attempts"`,
      [BATCH_SIZE],
    );
  }

  /** Sends one outbox row to all of the user's enabled devices. */
  private async deliver(row: ClaimedOutbox): Promise<boolean> {
    const devices: DeviceRow[] = await this.dataSource.query(
      `SELECT "id", "expo_token" FROM "push_devices"
        WHERE "user_id" = $1 AND "enabled" = true`,
      [row.user_id],
    );

    if (devices.length === 0) {
      // Nothing to deliver to — terminal, not an error.
      await this.dataSource.query(
        `UPDATE "notification_outbox" SET "status" = 'cancelled', "updated_at" = now() WHERE "id" = $1`,
        [row.id],
      );
      return false;
    }

    const valid = devices.filter((d) => PushSenderService.isValidToken(d.expo_token));
    const messages: ExpoPushMessage[] = valid.map((d) => ({
      to: d.expo_token,
      title: row.title,
      body: row.body,
      data: row.data as unknown as Record<string, unknown>,
      sound: 'default',
      channelId: row.channel_id,
      priority: 'high',
      ttl: DEFAULT_TTL_SECONDS,
    }));

    const tickets = await this.sender.send(messages);

    // Record a delivery per device, positionally aligned with tickets.
    let anyOk = false;
    for (let i = 0; i < valid.length; i++) {
      const ticket = tickets[i];
      const ok = ticket?.status === 'ok';
      if (ok) anyOk = true;
      await this.dataSource.query(
        `INSERT INTO "notification_deliveries"
           ("outbox_id", "device_id", "expo_ticket_id", "error", "attempts")
         VALUES ($1, $2, $3, $4, 1)`,
        [
          row.id,
          valid[i].id,
          ok && 'id' in ticket ? ticket.id : null,
          ok ? null : ((ticket as { message?: string })?.message ?? 'unknown'),
        ],
      );
    }

    await this.dataSource.query(
      `UPDATE "notification_outbox"
          SET "status" = $2, "attempts" = "attempts" + 1, "updated_at" = now()
        WHERE "id" = $1`,
      [row.id, anyOk ? 'sent' : 'failed'],
    );
    return anyOk;
  }

  /** Re-queue a row after a transport-level failure, with exponential backoff. */
  private async requeue(row: ClaimedOutbox, err: unknown): Promise<void> {
    const attempts = row.attempts + 1;
    const message = String(err);
    if (attempts >= MAX_ATTEMPTS) {
      this.logger.error(`Outbox ${row.id} failed permanently: ${message}`);
      await this.dataSource.query(
        `UPDATE "notification_outbox"
            SET "status" = 'failed', "attempts" = $2, "last_error" = $3, "updated_at" = now()
          WHERE "id" = $1`,
        [row.id, attempts, message],
      );
      return;
    }
    const backoffSeconds = Math.min(2 ** attempts * 30, 3600);
    await this.dataSource.query(
      `UPDATE "notification_outbox"
          SET "status" = 'pending', "attempts" = $2, "last_error" = $3,
              "scheduled_at" = now() + ($4 || ' seconds')::interval, "updated_at" = now()
        WHERE "id" = $1`,
      [row.id, attempts, message, backoffSeconds],
    );
  }
}
