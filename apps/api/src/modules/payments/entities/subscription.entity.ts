import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ProviderKey, SubscriptionStatus } from '@lexiroot/shared';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @Column({ type: 'varchar', length: 20 })
  provider!: ProviderKey;

  @Column({ name: 'provider_customer_id', type: 'varchar', length: 255, nullable: true })
  providerCustomerId!: string | null;

  @Column({ name: 'provider_subscription_id', type: 'varchar', length: 255, nullable: true })
  providerSubscriptionId!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'INCOMPLETE' })
  status!: SubscriptionStatus;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ name: 'current_period_start', type: 'timestamptz', nullable: true })
  currentPeriodStart!: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd!: Date | null;

  @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ name: 'canceled_at', type: 'timestamptz', nullable: true })
  canceledAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
