import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { SubscriptionStatus } from '@lexiroot/shared';

/**
 * Append-only log of subscription status transitions — see the migration for
 * why this exists. Written once per legal transition by
 * SubscriptionStateService.apply(), in the same transaction as the state
 * change itself, so the log can never drift from the subscription row.
 */
@Entity('subscription_status_events')
export class SubscriptionStatusEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'from_status', type: 'varchar', length: 20 })
  fromStatus!: SubscriptionStatus;

  @Column({ name: 'to_status', type: 'varchar', length: 20 })
  toStatus!: SubscriptionStatus;

  @Index()
  @CreateDateColumn({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;
}
