import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { AdminRole } from '@lexiroot/shared';

@Entity('admin_invitations')
export class AdminInvitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  email!: string;

  @Column({ name: 'display_name' })
  displayName!: string;

  @Column({ type: 'varchar', length: 20 })
  role!: AdminRole;

  @Column({ type: 'varchar', length: 2, nullable: true })
  country!: string | null;

  @Exclude()
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128 })
  token!: string;

  @Column({ name: 'invited_by_id', type: 'uuid', nullable: true })
  invitedById!: string | null;

  @Column({ name: 'invited_by_name', type: 'varchar', nullable: true })
  invitedByName!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
