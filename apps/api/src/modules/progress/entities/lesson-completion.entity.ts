import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('lesson_completions')
@Index('IDX_lesson_completions_user_lesson', ['userId', 'lessonId'], { unique: true })
export class LessonCompletion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'lesson_id', type: 'uuid' })
  lessonId!: string;

  @Column({ name: 'xp_earned', type: 'int', default: 0 })
  xpEarned!: number;

  @Column({ name: 'correct_count', type: 'int', default: 0 })
  correctCount!: number;

  @Column({ name: 'total_count', type: 'int', default: 0 })
  totalCount!: number;

  @CreateDateColumn({ name: 'completed_at', type: 'timestamptz' })
  completedAt!: Date;
}
