import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * A pending friend request, addressed to an email rather than to whoever holds
 * the link — the same rule family invitations follow, so a forwarded invite
 * can't be redeemed by someone it wasn't meant for.
 *
 * Revoking sets `revokedAt` rather than deleting, so the same person can be
 * invited again later without the unique token colliding.
 */
@Entity('friend_invites')
export class FriendInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'inviter_id', type: 'uuid' })
  inviterId!: string;

  @Index()
  @Column({ name: 'invited_email', type: 'varchar', length: 255 })
  invitedEmail!: string;

  @Column({ type: 'varchar', length: 64 })
  token!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
