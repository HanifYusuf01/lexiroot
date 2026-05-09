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
} from 'typeorm';

@Entity('pending_signups')
export class PendingSignup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ unique: true })
  email!: string;

  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'display_name' })
  displayName!: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  language!: LanguageCode | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  level!: LearningLevel | null;

  @Column({ name: 'learning_reason', type: 'varchar', length: 20, nullable: true })
  learningReason!: LearningReason | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  country!: CountryCode | null;

  @Index()
  @Column({ type: 'varchar', length: 6 })
  code!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
