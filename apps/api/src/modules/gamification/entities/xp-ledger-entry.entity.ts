import type { RpActivity } from '@lexiroot/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Why points were awarded. This ledger is the record of Root Points: the
 * weekly leaderboard is a sum over it, and `users.xp` is its lifetime total —
 * the same currency under two names, so renaming XP to RP costs nobody their
 * history.
 *
 * Achievements and streaks stay recognition-only; they never write rows.
 * `admin_adjustment` is the manual escape hatch for support.
 */
export type XpReason = RpActivity;

export type XpSourceType = 'lesson' | null;

@Entity('xp_ledger')
@Index('IDX_xp_ledger_user_created', ['userId', 'createdAt'])
export class XpLedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'int' })
  amount!: number;

  @Column({ type: 'varchar', length: 40 })
  reason!: XpReason;

  @Column({ name: 'source_type', type: 'varchar', length: 30, nullable: true })
  sourceType!: XpSourceType;

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId!: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
