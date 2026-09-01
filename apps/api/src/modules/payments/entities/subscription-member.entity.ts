import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A seat on a family subscription.
 *
 * A row is created as a pending invite (`userId` null, `token` live) and
 * becomes a membership on accept. Revoking sets `revokedAt` rather than
 * deleting, so a removed seat leaves an audit trail and the partial unique
 * indexes allow the same person to be re-invited later.
 */
@Entity('subscription_members')
export class SubscriptionMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId!: string;

  /** Null until the invite is accepted. */
  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'invited_email', type: 'varchar', length: 255 })
  invitedEmail!: string;

  @Column({ type: 'varchar', length: 64 })
  token!: string;

  @Column({ name: 'invited_by_id', type: 'uuid', nullable: true })
  invitedById!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
