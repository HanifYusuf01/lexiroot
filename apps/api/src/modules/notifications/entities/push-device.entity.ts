import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { PushPlatform } from '@lexiroot/shared';
import { User } from '../../users/entities/user.entity';

/** One row per (user, installation). Holds the Expo push token for a device. */
@Entity('push_devices')
@Unique('UQ_push_devices_user_installation', ['userId', 'installationId'])
export class PushDevice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index('IDX_push_devices_user')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'installation_id', type: 'varchar', length: 128 })
  installationId!: string;

  @Column({ name: 'expo_token', type: 'varchar', length: 256 })
  @Index('IDX_push_devices_token')
  expoToken!: string;

  @Column({ type: 'varchar', length: 10 })
  platform!: PushPlatform;

  /** IANA timezone (e.g. `Africa/Lagos`) — used to localise scheduled sends. */
  @Column({ type: 'varchar', length: 64 })
  timezone!: string;

  /** UI locale, kept distinct from the user's learning language. */
  @Column({ type: 'varchar', length: 16 })
  locale!: string;

  @Column({ name: 'app_version', type: 'varchar', length: 32, nullable: true })
  appVersion!: string | null;

  /** Flipped false when Expo reports the token as DeviceNotRegistered. */
  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Column({ name: 'last_seen_at', type: 'timestamptz', default: () => 'now()' })
  lastSeenAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
