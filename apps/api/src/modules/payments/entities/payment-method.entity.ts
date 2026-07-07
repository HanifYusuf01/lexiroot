import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { ProviderKey } from '@lexiroot/shared';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  provider!: ProviderKey;

  /** Provider token — never the raw card number (Rule 9c). */
  @Column({ name: 'provider_pm_id', type: 'varchar', length: 255 })
  providerPmId!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  brand!: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  last4!: string | null;

  @Column({ name: 'exp_month', type: 'int', nullable: true })
  expMonth!: number | null;

  @Column({ name: 'exp_year', type: 'int', nullable: true })
  expYear!: number | null;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
