import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import {
  FAMILY_MAX_SEATS,
  type AcceptFamilyInviteResult,
  type FamilyInvitePreview,
  type FamilyOverview,
  type FamilySeat,
} from '@lexiroot/shared';
import { EmailService } from '../auth/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { EntitlementService } from './entitlement.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionMember } from './entities/subscription-member.entity';

/** Statuses that still entitle, so a lapsed plan can't be shared onward. */
const LIVE_STATUSES = ['TRIALING', 'ACTIVE', 'PAST_DUE'] as const;
const INVITE_TTL_DAYS = 7;

/**
 * Family plan sharing.
 *
 * Six seats *including the owner*. Every seat is a full, separate account —
 * its own language, level and progress — so nothing here touches learning data;
 * the only thing shared is entitlement, resolved in `EntitlementService`.
 */
@Injectable()
export class FamilyService {
  private readonly logger = new Logger(FamilyService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(SubscriptionMember)
    private readonly members: Repository<SubscriptionMember>,
    @InjectRepository(SubscriptionPlan)
    private readonly plans: Repository<SubscriptionPlan>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly entitlements: EntitlementService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  /** The caller's live family-sharing subscription, or null. */
  private async ownedFamilySubscription(userId: string): Promise<Subscription | null> {
    const rows = await this.subscriptions.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    const live = rows.find((s) => (LIVE_STATUSES as readonly string[]).includes(s.status));
    if (!live) return null;
    const plan = await this.plans.findOne({ where: { id: live.planId } });
    // `family_sharing` on the plan is what makes a subscription shareable —
    // never the plan's name or scope, which are display concerns.
    return plan?.features?.includes('family_sharing') ? live : null;
  }

  /** Live seats: accepted members plus invites still awaiting acceptance. */
  private liveSeats(subscriptionId: string): Promise<SubscriptionMember[]> {
    return this.members.find({
      where: { subscriptionId, revokedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  async overview(userId: string): Promise<FamilyOverview> {
    const subscription = await this.ownedFamilySubscription(userId);
    if (!subscription) {
      return { enabled: false, isOwner: false, maxSeats: FAMILY_MAX_SEATS, usedSeats: 0, seats: [] };
    }

    const owner = await this.users.findOne({ where: { id: userId } });
    const rows = await this.liveSeats(subscription.id);
    const memberUsers = await this.usersById(rows.map((r) => r.userId));

    const seats: FamilySeat[] = [
      {
        id: null,
        status: 'owner',
        userId,
        email: owner?.email ?? '',
        displayName: owner?.displayName ?? null,
        invitedAt: null,
        acceptedAt: null,
      },
      ...rows.map((row): FamilySeat => {
        const u = row.userId ? memberUsers.get(row.userId) : undefined;
        return {
          id: row.id,
          status: row.acceptedAt ? 'member' : 'pending',
          userId: row.userId,
          email: u?.email ?? row.invitedEmail,
          displayName: u?.displayName ?? null,
          invitedAt: row.createdAt.toISOString(),
          acceptedAt: row.acceptedAt ? row.acceptedAt.toISOString() : null,
        };
      }),
    ];

    return {
      enabled: true,
      isOwner: true,
      maxSeats: FAMILY_MAX_SEATS,
      usedSeats: seats.length,
      seats,
    };
  }

  private async usersById(ids: (string | null)[]): Promise<Map<string, User>> {
    const known = ids.filter((id): id is string => !!id);
    if (known.length === 0) return new Map();
    const rows = await this.users.find({ where: known.map((id) => ({ id })) });
    return new Map(rows.map((u) => [u.id, u]));
  }

  /**
   * Invite an email address to the caller's family plan.
   *
   * Pending invites count against the cap — otherwise six invites could be sent
   * on a six-seat plan and all accepted.
   */
  async invite(userId: string, rawEmail: string): Promise<FamilyOverview> {
    const subscription = await this.ownedFamilySubscription(userId);
    if (!subscription) {
      throw new ForbiddenException('Your plan does not include family sharing.');
    }
    const email = rawEmail.trim().toLowerCase();

    const owner = await this.users.findOne({ where: { id: userId } });
    if (owner?.email.toLowerCase() === email) {
      throw new BadRequestException('You already have a seat on this plan.');
    }

    const rows = await this.liveSeats(subscription.id);
    if (rows.some((r) => r.invitedEmail === email && !r.revokedAt)) {
      throw new BadRequestException('That person has already been invited.');
    }
    // +1 for the owner, who holds a seat without a membership row.
    if (rows.length + 1 >= FAMILY_MAX_SEATS) {
      throw new BadRequestException(
        `This plan is limited to ${FAMILY_MAX_SEATS} people, including you.`,
      );
    }

    const invitee = await this.users.findOne({ where: { email } });
    if (invitee) {
      const elsewhere = await this.members.findOne({
        where: { userId: invitee.id, acceptedAt: Not(IsNull()), revokedAt: IsNull() },
      });
      if (elsewhere) {
        throw new BadRequestException('That person is already on another family plan.');
      }
    }

    const member = await this.members.save(
      this.members.create({
        subscriptionId: subscription.id,
        userId: null,
        invitedEmail: email,
        token: randomBytes(24).toString('hex'),
        invitedById: userId,
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      }),
    );

    const plan = await this.plans.findOne({ where: { id: subscription.planId } });
    await this.email.sendFamilyInvitationEmail({
      email,
      inviterName: owner?.displayName ?? 'A LexiRoot learner',
      planName: plan?.name ?? 'Family',
      inviteUrl: this.inviteUrl(member.token),
      expiresInDays: INVITE_TTL_DAYS,
    });

    return this.overview(userId);
  }

  /** Deep link the mobile app resolves to the accept screen. */
  private inviteUrl(token: string): string {
    const base = this.config.get<string>('APP_INVITE_URL') ?? 'lexiroot://family-invite';
    return `${base}?token=${token}`;
  }

  /** Unauthenticated preview so the accept screen can name the inviter. */
  async preview(token: string): Promise<FamilyInvitePreview> {
    const member = await this.pendingByToken(token);
    const subscription = await this.subscriptions.findOne({
      where: { id: member.subscriptionId },
    });
    const [plan, inviter] = await Promise.all([
      subscription ? this.plans.findOne({ where: { id: subscription.planId } }) : null,
      member.invitedById ? this.users.findOne({ where: { id: member.invitedById } }) : null,
    ]);
    return {
      email: member.invitedEmail,
      invitedByName: inviter?.displayName ?? null,
      planName: plan?.name ?? null,
      expiresAt: member.expiresAt.toISOString(),
    };
  }

  private async pendingByToken(token: string): Promise<SubscriptionMember> {
    const member = await this.members.findOne({ where: { token } });
    if (!member || member.revokedAt) throw new NotFoundException('Invitation not found.');
    if (member.acceptedAt) throw new BadRequestException('This invitation has already been used.');
    if (member.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This invitation has expired.');
    }
    return member;
  }

  /**
   * Accept an invite as the authenticated caller.
   *
   * Someone who already pays for their own plan is allowed through rather than
   * blocked — they'd otherwise have to cancel and time it right. The result
   * flags it so the client can warn them they're still being billed.
   */
  async accept(userId: string, token: string): Promise<AcceptFamilyInviteResult> {
    const member = await this.pendingByToken(token);
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    // The invite is addressed to an email, so it can't be redeemed by whoever
    // happens to hold the link.
    if (user.email.toLowerCase() !== member.invitedEmail) {
      throw new ForbiddenException('This invitation was sent to a different email address.');
    }

    const subscription = await this.subscriptions.findOne({
      where: { id: member.subscriptionId },
    });
    if (!subscription || !(LIVE_STATUSES as readonly string[]).includes(subscription.status)) {
      throw new BadRequestException('This family plan is no longer active.');
    }
    // The plan can lose family sharing between the invite being sent and it
    // being opened — the owner switches to an individual plan, or an admin
    // edits the plan's features. Accepting then would hand out a seat that
    // entitles nothing, so refuse instead of letting them find out later.
    const plan = await this.plans.findOne({ where: { id: subscription.planId } });
    if (!plan?.features?.includes('family_sharing')) {
      throw new BadRequestException('This plan no longer includes family sharing.');
    }
    if (subscription.userId === userId) {
      throw new BadRequestException('You already own this plan.');
    }

    const elsewhere = await this.members.findOne({
      where: { userId, acceptedAt: Not(IsNull()), revokedAt: IsNull() },
    });
    if (elsewhere) throw new BadRequestException('You are already on another family plan.');

    // Re-check the cap at accept time: seats may have filled since the invite
    // was sent, and the pending row itself is already counted in `liveSeats`.
    const rows = await this.liveSeats(subscription.id);
    const taken = rows.filter((r) => r.id !== member.id).length + 1;
    if (taken >= FAMILY_MAX_SEATS) {
      throw new BadRequestException('This family plan is full.');
    }

    const hadOwnSubscription = await this.entitlements.isEntitled(userId);

    member.userId = userId;
    member.acceptedAt = new Date();
    await this.members.save(member);

    // Without this the new seat wouldn't take effect for up to the cache TTL.
    this.entitlements.invalidate(userId);
    return { hadOwnSubscription };
  }

  /** Revoke a pending invite or remove an accepted member. Owner only. */
  async removeSeat(userId: string, memberId: string): Promise<FamilyOverview> {
    const subscription = await this.ownedFamilySubscription(userId);
    if (!subscription) {
      throw new ForbiddenException('Your plan does not include family sharing.');
    }
    const member = await this.members.findOne({
      where: { id: memberId, subscriptionId: subscription.id },
    });
    if (!member || member.revokedAt) throw new NotFoundException('Seat not found.');

    const wasAccepted = !!member.acceptedAt;
    member.revokedAt = new Date();
    await this.members.save(member);

    // A removed member must lose access now, not when their cache entry ages out.
    if (member.userId) this.entitlements.invalidate(member.userId);

    // Only somebody who actually had access needs telling. Cancelling an invite
    // that was never accepted takes nothing away, so it stays silent.
    if (wasAccepted && member.userId) {
      await this.announceSeatEnded(member.userId, subscription.planId, userId, 'removed');
    }
    return this.overview(userId);
  }

  /**
   * End every live seat on a subscription because the plan behind them no
   * longer shares.
   *
   * Called when a scheduled downgrade actually lands (BillingService), not when
   * it is requested — the members keep what the owner already paid for until
   * the period ends. Pending invites are revoked too: an unaccepted invite to a
   * plan that no longer shares would only lead somewhere disappointing.
   */
  async endSeatsForPlanChange(
    subscriptionId: string,
    previousPlanId: string,
    newPlanId: string,
  ): Promise<void> {
    const plan = await this.plans.findOne({ where: { id: newPlanId } });
    if (plan?.features?.includes('family_sharing')) return;

    const subscription = await this.subscriptions.findOne({ where: { id: subscriptionId } });
    if (!subscription) return;

    const seats = await this.liveSeats(subscriptionId);
    if (seats.length === 0) return;

    const revokedAt = new Date();
    for (const seat of seats) {
      seat.revokedAt = revokedAt;
    }
    await this.members.save(seats);

    for (const seat of seats) {
      if (!seat.userId) continue; // a pending invite has nobody to tell
      this.entitlements.invalidate(seat.userId);
      // The plan they're told about is the one they *had* — by now the
      // subscription's own `planId` has already moved to the new one.
      await this.announceSeatEnded(
        seat.userId,
        previousPlanId,
        subscription.userId,
        'plan_changed',
      );
    }
  }

  /**
   * Tell someone their seat has ended, by push and by email.
   *
   * Both, deliberately: the push is what they see in the moment, the email is
   * what survives and explains that their account and progress are intact. A
   * learner who only sees the app lock reads it as "I was never subscribed".
   *
   * Never allowed to fail the caller — the seat has already ended, and a
   * bounced email is not a reason to leave the plan in a half-changed state.
   */
  private async announceSeatEnded(
    memberUserId: string,
    planId: string,
    ownerId: string,
    reason: 'removed' | 'plan_changed',
  ): Promise<void> {
    try {
      const [member, owner, plan] = await Promise.all([
        this.users.findOne({ where: { id: memberUserId } }),
        this.users.findOne({ where: { id: ownerId } }),
        this.plans.findOne({ where: { id: planId } }),
      ]);
      if (!member) return;

      const ownerName = owner?.displayName ?? 'The plan owner';
      const planName = plan?.name ?? 'family';

      await this.notifications.enqueue({
        userId: memberUserId,
        type: 'family_seat_revoked',
        title: 'Your shared plan has ended',
        body:
          reason === 'plan_changed'
            ? `${ownerName} moved off the ${planName} plan you shared. Your account and progress are safe.`
            : `${ownerName} removed your seat on their ${planName} plan. Your account and progress are safe.`,
        data: { route: '/subscription' },
        // One notice per seat ending, however many times this is reached.
        dedupeKey: `family-seat-ended:${memberUserId}:${planId}:${reason}`,
      });

      await this.email.sendFamilySeatRemovedEmail({
        email: member.email,
        displayName: member.displayName ?? 'there',
        ownerName,
        planName,
        reason,
      });
    } catch (err) {
      this.logger.error(
        `Could not tell ${memberUserId} their family seat ended: ${(err as Error).message}`,
      );
    }
  }

  /** Leave a family plan you were invited to (the member's own action). */
  async leave(userId: string): Promise<void> {
    const member = await this.members.findOne({
      where: { userId, acceptedAt: Not(IsNull()), revokedAt: IsNull() },
    });
    if (!member) throw new NotFoundException('You are not on a family plan.');
    member.revokedAt = new Date();
    await this.members.save(member);
    this.entitlements.invalidate(userId);
  }
}
