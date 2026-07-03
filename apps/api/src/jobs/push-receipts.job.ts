import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DevicesService } from '../modules/notifications/devices.service';
import { PushSenderService } from '../modules/notifications/push-sender.service';

interface PendingReceipt {
  id: string;
  expo_ticket_id: string;
  expo_token: string;
}

const BATCH_SIZE = 300;

/**
 * A ticket only means Expo *accepted* a message; the receipt is the ground
 * truth for whether APNs/FCM actually delivered it. This job fetches receipts
 * for recently-sent deliveries, records their status, and — critically —
 * disables tokens that come back as `DeviceNotRegistered` so we stop wasting
 * sends on uninstalled apps / revoked permissions.
 */
@Injectable()
export class PushReceiptsJob {
  private readonly logger = new Logger(PushReceiptsJob.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly sender: PushSenderService,
    private readonly devices: DevicesService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async run(): Promise<void> {
    // Expo keeps receipts for ~24h; only chase recent, still-unresolved ones.
    const pending: PendingReceipt[] = await this.dataSource.query(
      `SELECT d."id", d."expo_ticket_id", pd."expo_token"
         FROM "notification_deliveries" d
         JOIN "push_devices" pd ON pd."id" = d."device_id"
        WHERE d."expo_ticket_id" IS NOT NULL
          AND d."receipt_status" IS NULL
          AND d."created_at" >= now() - interval '24 hours'
        LIMIT $1`,
      [BATCH_SIZE],
    );
    if (pending.length === 0) return;

    const receipts = await this.sender.getReceipts(pending.map((p) => p.expo_ticket_id));

    let resolved = 0;
    const staleTokens = new Set<string>();
    for (const row of pending) {
      const receipt = receipts[row.expo_ticket_id];
      if (!receipt) continue; // not ready yet — pick it up next tick
      resolved++;

      if (receipt.status === 'ok') {
        await this.setReceipt(row.id, 'ok', null);
      } else {
        const detail = receipt.details?.error ?? receipt.message ?? 'error';
        await this.setReceipt(row.id, 'error', detail);
        if (receipt.details?.error === 'DeviceNotRegistered') {
          staleTokens.add(row.expo_token);
        }
      }
    }

    for (const token of staleTokens) {
      await this.devices.disableToken(token);
    }
    this.logger.log(`Receipts: resolved ${resolved}, disabled ${staleTokens.size} token(s)`);
  }

  private setReceipt(id: string, status: 'ok' | 'error', error: string | null): Promise<unknown> {
    return this.dataSource.query(
      `UPDATE "notification_deliveries"
          SET "receipt_status" = $2, "error" = COALESCE($3, "error"), "updated_at" = now()
        WHERE "id" = $1`,
      [id, status, error],
    );
  }
}
