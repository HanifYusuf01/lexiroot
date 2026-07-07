import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ProviderKey } from '@lexiroot/shared';

/**
 * Maps a catalog plan to a single provider's price/product. One row per
 * (plan, provider) — keeps `subscription_plans` provider-neutral.
 */
@Entity('plan_provider_prices')
export class PlanProviderPrice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @Column({ type: 'varchar', length: 20 })
  provider!: ProviderKey;

  @Column({ name: 'provider_product_id', type: 'varchar', length: 255, nullable: true })
  providerProductId!: string | null;

  @Column({ name: 'provider_price_id', type: 'varchar', length: 255 })
  providerPriceId!: string;

  /** Integer minor units (cents/kobo). */
  @Column({ name: 'amount_minor', type: 'int' })
  amountMinor!: number;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ type: 'varchar', length: 20, default: 'month' })
  interval!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
