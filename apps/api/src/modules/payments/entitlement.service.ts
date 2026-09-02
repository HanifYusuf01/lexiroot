import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ENTITLED_SUBSCRIPTION_STATUSES,
  FREE_FEATURE_KEYS,
  PLAN_FEATURE_KEYS,
  type PlanFeatureKey,
  type SubscriptionStatus,
  SUBSCRIPTION_STATUS_TEXT,
  type SubscriptionSummary,
} from '@lexiroot/shared';
import type { PaymentsConfig } from '../../config/payments.config';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { Subscription } from './entities/subscription.entity';

const DAY_MS = 24 * 60 * 60 * 1000;

interface CachedEntitlement {
  features: PlanFeatureKey[];
  summary: SubscriptionSummary;
  computedAt: number;
}

/**
 * THE single place access is computed (Rule 5a). Access = the subscription is in
 * an entitled status (TRIALING/ACTIVE/PAST_DUE) AND now is before the current
 * period end plus grace. Access is NEVER read off a payment row (Rule 0/5).
 *
 * Results are cached per user and invalidated on every state change via
 * `invalidate()` (Rule 5b) — the billing/state services call it inside their
 * transactions.
 */
@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);
  private readonly cache = new Map<string, CachedEntitlement>();
  // Safety net so a missed invalidation can't pin stale access forever.
  private readonly ttlMs = 60_000;

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly plans: Repository<SubscriptionPlan>,
    private readonly config: ConfigService,
  ) {}

  private get graceMs(): number {
    return this.config.getOrThrow<PaymentsConfig>('payments').graceDays * DAY_MS;
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * The most relevant subscription for entitlement (live before terminal).
   *
   * Considers subscriptions the user owns *and* any they hold a family seat on,
   * so one paid family plan entitles every accepted member. Owned rows are
   * preferred when both are live: the summary a learner sees should describe the
   * plan they pay for, not somebody else's.
   *
   * A shared seat only counts while the membership is accepted and not revoked;
   * whether the underlying subscription is still *live* is then decided by
   * `isEntitledNow` exactly as it is for an owner, so a lapsed family plan drops
   * every member automatically.
   */
  private async activeSubscription(userId: string): Promise<Subscription | null> {
    const [owned, shared] = await Promise.all([
      this.subscriptions.find({ where: { userId }, order: { createdAt: 'DESC' } }),
      this.sharedSubscriptions(userId),
    ]);
    const live = (rows: Subscription[]) =>
      rows.find((s) => s.status !== 'EXPIRED' && s.status !== 'INCOMPLETE') ?? null;

    // Owned-live → shared-live → most recent owned (summaries for lapsed users)
    // → shared, so someone whose own plan expired still sees family access.
    return live(owned) ?? live(shared) ?? owned[0] ?? shared[0] ?? null;
  }

  /**
   * Subscriptions this user is an accepted, unrevoked family member of.
   *
   * The plan join is not decoration: a seat only entitles while the plan it
   * hangs off still sells family sharing. Without it, an owner moving from a
   * Family plan to an Individual one — or an admin editing the plan's features
   * — would leave every member entitled by a plan that no longer includes them.
   */
  private sharedSubscriptions(userId: string): Promise<Subscription[]> {
    return this.subscriptions
      .createQueryBuilder('sub')
      .innerJoin(
        'subscription_members',
        'm',
        `m.subscription_id = sub.id
           AND m.user_id = :userId
           AND m.accepted_at IS NOT NULL
           AND m.revoked_at IS NULL`,
        { userId },
      )
      .innerJoin(
        'subscription_plans',
        'p',
        `p.id = sub.plan_id AND p.features @> '["family_sharing"]'::jsonb`,
      )
      .orderBy('sub.created_at', 'DESC')
      .getMany();
  }

  private isEntitledNow(sub: Subscription | null): boolean {
    if (!sub) return false;
    if (!ENTITLED_SUBSCRIPTION_STATUSES.includes(sub.status)) return false;
    if (!sub.currentPeriodEnd) return false;
    return Date.now() < sub.currentPeriodEnd.getTime() + this.graceMs;
  }

  async isEntitled(userId: string): Promise<boolean> {
    return this.isEntitledNow(await this.activeSubscription(userId));
  }

  /** Entitled feature keys — the plan's features when entitled, else free tier. */
  async getFeatures(userId: string): Promise<PlanFeatureKey[]> {
    return (await this.getEntitlement(userId)).features;
  }

  async getSummary(userId: string): Promise<SubscriptionSummary> {
    return (await this.getEntitlement(userId)).summary;
  }

  private async getEntitlement(
    userId: string,
  ): Promise<{ features: PlanFeatureKey[]; summary: SubscriptionSummary }> {
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.computedAt < this.ttlMs) {
      return { features: cached.features, summary: cached.summary };
    }

    const sub = await this.activeSubscription(userId);
    const entitled = this.isEntitledNow(sub);

    let features: PlanFeatureKey[] = [...FREE_FEATURE_KEYS];
    if (entitled && sub) {
      const plan = await this.plans.findOne({ where: { id: sub.planId } });
      if (plan?.features?.length) {
        // Plans created before the feature catalog stored free-text labels, which
        // grant nothing — a paying user silently keeps the free tier. Validation
        // blocks new ones (CreateSubscriptionPlanDto), but legacy rows survive.
        const granted = plan.features.filter((f) => PLAN_FEATURE_KEYS.includes(f));
        if (granted.length !== plan.features.length) {
          this.logger.warn(
            `Plan ${plan.id} ("${plan.name}") has non-catalog features ` +
              `[${plan.features.filter((f) => !PLAN_FEATURE_KEYS.includes(f)).join(', ')}] ` +
              `— they grant no access. Re-save the plan in admin to fix.`,
          );
        }
        if (granted.length) features = granted;
      }
    }

    const summary = this.toSummary(sub);
    this.cache.set(userId, { features, summary, computedAt: Date.now() });
    return { features, summary };
  }

  private toSummary(sub: Subscription | null): SubscriptionSummary {
    if (!sub) {
      return {
        status: 'EXPIRED',
        statusText: 'No subscription',
        planId: null,
        renewsOn: null,
        cancelsOn: null,
        provider: null,
        pendingPlanId: null,
        pendingPlanEffectiveAt: null,
      };
    }
    const status: SubscriptionStatus = sub.status;
    const periodEndIso = sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null;
    return {
      status,
      statusText: SUBSCRIPTION_STATUS_TEXT[status],
      planId: sub.planId,
      // "Renews on" only when it will actually auto-renew.
      renewsOn: status === 'ACTIVE' && !sub.cancelAtPeriodEnd ? periodEndIso : null,
      // "Cancels on" when winding down but access still runs to period end.
      cancelsOn:
        sub.cancelAtPeriodEnd || status === 'CANCELED' ? periodEndIso : null,
      provider: sub.provider,
      pendingPlanId: sub.pendingPlanId,
      pendingPlanEffectiveAt: sub.pendingPlanEffectiveAt
        ? sub.pendingPlanEffectiveAt.toISOString()
        : null,
    };
  }
}
