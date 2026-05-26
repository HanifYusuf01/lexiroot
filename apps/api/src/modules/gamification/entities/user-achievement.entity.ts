import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Achievement } from './achievement.entity';

@Entity('user_achievements')
@Index('UQ_user_achievements_user_achievement', ['userId', 'achievementId'], { unique: true })
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'achievement_id', type: 'uuid' })
  achievementId!: string;

  @ManyToOne(() => Achievement, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'achievement_id' })
  achievement!: Achievement;

  @CreateDateColumn({ name: 'earned_at', type: 'timestamptz' })
  earnedAt!: Date;
}
