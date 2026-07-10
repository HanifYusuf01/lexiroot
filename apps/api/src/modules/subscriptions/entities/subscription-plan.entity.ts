import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { PlanFeatureKey, PlanPriceOverrides, PlanScope } from '@lexiroot/shared';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20 })
  scope!: PlanScope;

  @Column({ type: 'varchar', length: 60 })
  name!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  price!: string;

  @Column({ type: 'varchar', length: 20, default: 'Month' })
  period!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  total!: string | null;

  /** Non-base (non-USD) currency amounts, keyed by currency. USD is price/total. */
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  prices!: PlanPriceOverrides;

  @Column({ type: 'boolean', default: false })
  premium!: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  features!: PlanFeatureKey[];

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
