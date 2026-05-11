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
import type {
  DurationBucket,
  LessonMeta,
  LessonStatus,
  LessonType,
} from '@lexiroot/shared';
import type { LanguageCode, LearningLevel } from '@lexiroot/shared';
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 2 })
  language!: LanguageCode;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  level!: LearningLevel;

  @Index()
  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 220 })
  slug!: string;

  @Column({ name: 'short_description', type: 'varchar', length: 200, default: '' })
  shortDescription!: string;

  @Column({ name: 'estimated_duration', type: 'varchar', length: 30, nullable: true })
  estimatedDuration!: DurationBucket | null;

  @Column({ name: 'xp_reward', type: 'int', default: 0 })
  xpReward!: number;

  @Column({ name: 'order_in_unit', type: 'int', default: 0 })
  orderInUnit!: number;

  @Index()
  @Column({ type: 'varchar', length: 30 })
  type!: LessonType;

  @Column({ name: 'speech_required', type: 'boolean', default: false })
  speechRequired!: boolean;

  @Column({ name: 'offline_available', type: 'boolean', default: true })
  offlineAvailable!: boolean;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: LessonStatus;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  meta!: LessonMeta;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
