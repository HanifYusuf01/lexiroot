import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  NotificationChannelId,
  NotificationData,
  NotificationType,
  OutboxStatus,
} from '@lexiroot/shared';

/**
 * Durable queue of server-driven pushes. A worker drains due `pending` rows,
 * fans each out to the recipient's enabled devices, and advances the status.
 */
@Entity('notification_outbox')
export class NotificationOutbox {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 48 })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 128 })
  title!: string;

  @Column({ type: 'varchar', length: 256 })
  body!: string;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  data!: NotificationData;

  @Column({ name: 'channel_id', type: 'varchar', length: 32 })
  channelId!: NotificationChannelId;

  @Column({ name: 'scheduled_at', type: 'timestamptz', default: () => 'now()' })
  @Index('IDX_notification_outbox_due')
  scheduledAt!: Date;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: OutboxStatus;

  /**
   * Optional idempotency key. A unique constraint means enqueuing the same
   * logical event twice (e.g. an achievement re-award) is a no-op.
   */
  @Column({ name: 'dedupe_key', type: 'varchar', length: 160, nullable: true })
  dedupeKey!: string | null;

  @Column({ type: 'integer', default: 0 })
  attempts!: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
