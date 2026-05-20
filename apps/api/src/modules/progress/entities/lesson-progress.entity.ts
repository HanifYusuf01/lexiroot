import type { LessonStepKind } from '@lexiroot/shared';
import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('lesson_progress')
@Index('IDX_lesson_progress_user_tier_level', ['userId', 'tier', 'level'], {
  unique: true,
})
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  tier!: string;

  @Column({ type: 'int' })
  level!: number;

  @Column({ name: 'sub_idx', type: 'int', default: 0 })
  subIdx!: number;

  @Column({ name: 'sub_lesson_id', type: 'uuid', nullable: true })
  subLessonId!: string | null;

  @Column({ name: 'step_kind', type: 'varchar', length: 32, default: 'intro' })
  stepKind!: LessonStepKind;

  @Column({ name: 'step_index', type: 'int', default: 0 })
  stepIndex!: number;

  @Column({ name: 'correct_count', type: 'int', default: 0 })
  correctCount!: number;

  @Column({ type: 'int', default: 0 })
  xp!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
