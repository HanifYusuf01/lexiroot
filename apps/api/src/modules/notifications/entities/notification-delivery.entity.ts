import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationOutbox } from './notification-outbox.entity';
import { PushDevice } from './push-device.entity';

/**
 * Per-device send record. A ticket id proves Expo *accepted* the message; the
 * receipt (fetched later) reveals whether APNs/FCM actually delivered it.
 */
@Entity('notification_deliveries')
export class NotificationDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'outbox_id', type: 'uuid' })
  outboxId!: string;

  @ManyToOne(() => NotificationOutbox, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outbox_id' })
  outbox!: NotificationOutbox;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  @ManyToOne(() => PushDevice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device!: PushDevice;

  @Column({ name: 'expo_ticket_id', type: 'varchar', length: 128, nullable: true })
  @Index('IDX_notification_deliveries_ticket')
  expoTicketId!: string | null;

  /** null = receipt not yet fetched; then 'ok' | 'error'. */
  @Column({ name: 'receipt_status', type: 'varchar', length: 16, nullable: true })
  receiptStatus!: string | null;

  @Column({ type: 'integer', default: 0 })
  attempts!: number;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
