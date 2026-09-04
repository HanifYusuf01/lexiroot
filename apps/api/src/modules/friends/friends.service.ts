import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import {
  FRIEND_INVITE_TTL_DAYS,
  type FriendInvitePreview,
  type FriendSummary,
  type FriendsOverview,
} from '@lexiroot/shared';
import { EmailService } from '../auth/email.service';
import { User } from '../users/entities/user.entity';
import { FriendInvite } from './entities/friend-invite.entity';
import { Friendship } from './entities/friendship.entity';

/** Nobody needs more than this, and it keeps the board a board. */
const MAX_FRIENDS = 100;

/**
 * Friends, for the friends leaderboard.
 *
 * Deliberately mirrors family invitations rather than inventing a second
 * pattern: an invitation is addressed to an email, carries a random token,
 * expires, and can only be accepted by someone signed in as that address. A
 * link forwarded to the wrong person is useless, which is the property that
 * matters.
 *
 * Friendship is mutual — both directions are written on accept — so nobody
 * appears on a board they never agreed to be on.
 */
@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(FriendInvite)
    private readonly invites: Repository<FriendInvite>,
    @InjectRepository(Friendship)
    private readonly friendships: Repository<Friendship>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async overview(userId: string): Promise<FriendsOverview> {
    const me = await this.users.findOne({ where: { id: userId } });
    const [links, sent, received] = await Promise.all([
      this.friendships.find({ where: { userId } }),
      this.invites.find({
        where: { inviterId: userId, acceptedAt: IsNull(), revokedAt: IsNull() },
      }),
      me
        ? this.invites.find({
            where: {
              invitedEmail: me.email.toLowerCase(),
              acceptedAt: IsNull(),
              revokedAt: IsNull(),
            },
          })
        : Promise.resolve([]),
    ]);

    const friendUsers = await this.usersById(links.map((l) => l.friendId));
    const inviters = await this.usersById(received.map((r) => r.inviterId));

    return {
      friends: links.map((link): FriendSummary => {
        const u = friendUsers.get(link.friendId);
        return {
          id: link.friendId,
          status: 'friend',
          userId: link.friendId,
          email: u?.email ?? '',
          displayName: u?.displayName ?? null,
          avatarUrl: u?.avatarUrl ?? null,
        };
      }),
      pending: sent.map((invite): FriendSummary => ({
        id: invite.id,
        status: 'pending',
        userId: null,
        email: invite.invitedEmail,
        displayName: null,
        avatarUrl: null,
      })),
      incoming: received
        .filter((invite) => invite.expiresAt.getTime() >= Date.now())
        .map((invite): FriendSummary => {
          const u = inviters.get(invite.inviterId);
          return {
            id: invite.id,
            status: 'incoming',
            userId: invite.inviterId,
            email: u?.email ?? '',
            displayName: u?.displayName ?? null,
            avatarUrl: u?.avatarUrl ?? null,
          };
        }),
    };
  }

  private async usersById(ids: string[]): Promise<Map<string, User>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();
    const rows = await this.users.find({ where: unique.map((id) => ({ id })) });
    return new Map(rows.map((u) => [u.id, u]));
  }

  /** Invite an email address to be friends. */
  async invite(userId: string, rawEmail: string): Promise<FriendsOverview> {
    const email = rawEmail.trim().toLowerCase();
    const me = await this.users.findOne({ where: { id: userId } });
    if (!me) throw new NotFoundException('User not found.');
    if (me.email.toLowerCase() === email) {
      throw new BadRequestException("That's your own address.");
    }

    const existingCount = await this.friendships.count({ where: { userId } });
    if (existingCount >= MAX_FRIENDS) {
      throw new BadRequestException(`You can have up to ${MAX_FRIENDS} friends.`);
    }

    const target = await this.users.findOne({ where: { email } });
    if (target) {
      const already = await this.friendships.findOne({
        where: { userId, friendId: target.id },
      });
      if (already) throw new BadRequestException('You are already friends.');
    }

    const outstanding = await this.invites.findOne({
      where: {
        inviterId: userId,
        invitedEmail: email,
        acceptedAt: IsNull(),
        revokedAt: IsNull(),
      },
    });
    if (outstanding && outstanding.expiresAt.getTime() >= Date.now()) {
      throw new BadRequestException('You have already invited them.');
    }

    const invite = await this.invites.save(
      this.invites.create({
        inviterId: userId,
        invitedEmail: email,
        token: randomBytes(24).toString('hex'),
        expiresAt: new Date(Date.now() + FRIEND_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      }),
    );

    await this.email.sendFriendInvitationEmail({
      email,
      inviterName: me.displayName ?? 'A LexiRoot learner',
      inviteUrl: this.inviteUrl(invite.token),
      expiresInDays: FRIEND_INVITE_TTL_DAYS,
    });

    return this.overview(userId);
  }

  /** Deep link the app resolves to the accept screen. */
  private inviteUrl(token: string): string {
    const base = this.config.get<string>('APP_FRIEND_INVITE_URL') ?? 'lexiroot://friend-invite';
    return `${base}?token=${token}`;
  }

  /** Unauthenticated preview, so the accept screen can name the inviter. */
  async preview(token: string): Promise<FriendInvitePreview> {
    const invite = await this.pendingByToken(token);
    const inviter = await this.users.findOne({ where: { id: invite.inviterId } });
    return {
      email: invite.invitedEmail,
      invitedByName: inviter?.displayName ?? null,
      expiresAt: invite.expiresAt.toISOString(),
    };
  }

  private async pendingByToken(token: string): Promise<FriendInvite> {
    const invite = await this.invites.findOne({ where: { token } });
    if (!invite || invite.revokedAt) throw new NotFoundException('Invitation not found.');
    if (invite.acceptedAt) throw new BadRequestException('This invitation has already been used.');
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This invitation has expired.');
    }
    return invite;
  }

  /** Accept an invitation as the authenticated caller. */
  async accept(userId: string, token: string): Promise<FriendsOverview> {
    const invite = await this.pendingByToken(token);
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    // Addressed to an email, so a forwarded link is worthless to anyone else.
    if (user.email.toLowerCase() !== invite.invitedEmail) {
      throw new ForbiddenException('This invitation was sent to a different email address.');
    }
    if (invite.inviterId === userId) {
      throw new BadRequestException('You cannot accept your own invitation.');
    }

    invite.acceptedAt = new Date();
    await this.invites.save(invite);
    await this.link(invite.inviterId, userId);
    return this.overview(userId);
  }

  /**
   * Write both directions of a friendship, ignoring a pair that already exists
   * so accepting twice is harmless.
   */
  private async link(a: string, b: string): Promise<void> {
    await this.friendships
      .createQueryBuilder()
      .insert()
      .values([
        { userId: a, friendId: b },
        { userId: b, friendId: a },
      ])
      .orIgnore()
      .execute();
  }

  /** Remove a friend, or withdraw an invitation that hasn't been accepted. */
  async remove(userId: string, id: string): Promise<FriendsOverview> {
    const invite = await this.invites.findOne({ where: { id, inviterId: userId } });
    if (invite && !invite.acceptedAt) {
      invite.revokedAt = new Date();
      await this.invites.save(invite);
      return this.overview(userId);
    }

    // Both directions go together — a one-sided friendship would leave one
    // person still ranked on the other's board.
    const removed = await this.friendships.delete([
      { userId, friendId: id },
      { userId: id, friendId: userId },
    ]);
    if (!removed.affected) throw new NotFoundException('Not found.');
    return this.overview(userId);
  }
}
