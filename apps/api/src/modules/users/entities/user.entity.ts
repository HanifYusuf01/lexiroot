import { Exclude } from 'class-transformer';
import type {
  CountryCode,
  LanguageCode,
  LearningLevel,
  LearningReason,
} from '@lexiroot/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'user' | 'admin' | 'instructor';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'display_name' })
  displayName!: string;

  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role!: UserRole;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  language!: LanguageCode | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  level!: LearningLevel | null;

  @Column({ name: 'learning_reason', type: 'varchar', length: 20, nullable: true })
  learningReason!: LearningReason | null;

  @Index()
  @Column({ type: 'varchar', length: 2, nullable: true })
  country!: CountryCode | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 512, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'int', default: 0 })
  xp!: number;

  @Column({ name: 'current_streak_days', type: 'int', default: 0 })
  currentStreakDays!: number;

  @Column({ name: 'longest_streak_days', type: 'int', default: 0 })
  longestStreakDays!: number;

  @Column({ name: 'lessons_completed', type: 'int', default: 0 })
  lessonsCompleted!: number;

  @Index()
  @Column({ name: 'last_active_at', type: 'timestamptz', nullable: true })
  lastActiveAt!: Date | null;

  @Exclude()
  @Index()
  @Column({ name: 'password_reset_token', type: 'varchar', length: 128, nullable: true })
  passwordResetToken!: string | null;

  @Exclude()
  @Column({ name: 'password_reset_expires_at', type: 'timestamptz', nullable: true })
  passwordResetExpiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
