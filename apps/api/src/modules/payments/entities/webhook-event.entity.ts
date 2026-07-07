import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { ProviderKey } from '@lexiroot/shared';

export type WebhookEventStatus = 'received' | 'processed' | 'skipped' | 'failed';

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20 })
  provider!: ProviderKey;

  /** Provider's event id. Unique per provider → dedups replays (Rule 2a). */
  @Column({ name: 'provider_event_id', type: 'varchar', length: 255 })
  providerEventId!: string;

  @Column({ type: 'varchar', length: 120 })
  type!: string;

  @Column({ type: 'jsonb' })
  payload!: unknown;

  @Column({ type: 'varchar', length: 20, default: 'received' })
  status!: WebhookEventStatus;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @Column({ name: 'received_at', type: 'timestamptz', default: () => 'now()' })
  receivedAt!: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;
}
