import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// XP is only awarded for completing questions in a level. Achievements and
// streaks are recognition only — they never produce ledger rows. The
// admin_adjustment reason is a manual escape hatch for support cases.
export type XpReason = 'lesson_completion' | 'admin_adjustment';

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
