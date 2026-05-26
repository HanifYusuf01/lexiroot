import type { AchievementCode, AchievementKind } from '@lexiroot/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  code!: AchievementCode;

  @Column({ type: 'varchar', length: 80 })
  title!: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  description!: string;

  @Column({ name: 'icon_key', type: 'varchar', length: 40, default: 'medal' })
  iconKey!: string;

  @Column({ type: 'varchar', length: 40 })
  kind!: AchievementKind;

  @Column({ type: 'int', default: 0 })
  threshold!: number;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
