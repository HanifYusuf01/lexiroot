import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { LanguageCode, League, LearningLevel } from '@lexiroot/shared';

/**
 * One learner's final standing in a finished week.
 *
 * Written once, at rollover, and never recomputed — a settled week has to stay
 * settled. It is what "previous rank" and the promotion/demotion decision read,
 * and the grouping fields are stored rather than joined so a learner who later
 * switches language or level doesn't retroactively move in last week's table.
 */
@Entity('leaderboard_snapshots')
@Index('IDX_leaderboard_snapshots_period', ['periodStart'])
export class LeaderboardSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  /** The Monday (UTC) the week began. */
  @Column({ name: 'period_start', type: 'date' })
  periodStart!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  language!: LanguageCode | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  level!: LearningLevel | null;

  @Column({ type: 'varchar', length: 20 })
  league!: League;

  @Column({ name: 'root_points', type: 'int', default: 0 })
  rootPoints!: number;

  @Column({ type: 'int' })
  rank!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
