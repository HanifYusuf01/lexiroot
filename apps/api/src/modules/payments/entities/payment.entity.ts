import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { PaymentStatus, ProviderKey } from '@lexiroot/shared';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  provider!: ProviderKey;

  @Column({ name: 'provider_payment_id', type: 'varchar', length: 255, nullable: true })
  providerPaymentId!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'INITIATED' })
  status!: PaymentStatus;

  /** Integer minor units (cents/kobo). */
  @Column({ name: 'amount_minor', type: 'int' })
  amountMinor!: number;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ name: 'attempt_no', type: 'int', default: 1 })
  attemptNo!: number;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 255 })
  idempotencyKey!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
