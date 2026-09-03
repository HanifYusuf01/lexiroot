import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import {
  type AdminSubscription,
  type ChangePlanResponse,
  type ClientPlatform,
  type CountryCode,
  type CreateCheckoutResponse,
  type CurrencyCode,
  type PlanPeriod,
  planChangeDirection,
  type ProviderKey,
  type SubscriptionStatus,
  SUBSCRIPTION_STATUS_TEXT,
  type SubscriptionSummary,
} from '@lexiroot/shared';
import type { PaymentsConfig } from '../../config/payments.config';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { BillingService } from './billing.service';
import { planRecurring } from './plan-pricing';
import { EntitlementService } from './entitlement.service';
import { PlanProviderPrice } from './entities/plan-provider-price.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionMember } from './entities/subscription-member.entity';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';

/** Statuses that mean the user already has (or is finishing paying for) a plan. */
const LIVE_STATUSES = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'PAUSED'] as const;

/** Append a `redirect` deep link to a checkout return URL when provided. */
function withRedirect(baseUrl: string, deepLink?: string): string {
  if (!deepLink) return baseUrl;
  const sep = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${sep}redirect=${encodeURIComponent(deepLink)}`;
}

export interface ChangePlanOptions {
  userId: string;
  planId: string;
  /** Calling platform. Only used to phrase errors — the provider is fixed. */
  platform?: ClientPlatform;
  /** The caller has been told this ends everyone else's seat, and said yes. */
  confirmRemovesSeats?: boolean;
}

export interface CreateCheckoutOptions {
  userId: string;
  userEmail: string;
  /** The user's country, used to route card payments regionally. */
  userCountry: CountryCode | null;
  planId: string;
  /** Calling platform — iOS must bill through Apple IAP once it's live. */
  platform?: ClientPlatform;
  /** Explicit provider override; normally unset so the server resolves. */
  provider?: ProviderKey;
  returnDeepLink?: string;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(PlanProviderPrice)
    private readonly prices: Repository<PlanProviderPrice>,
    @InjectRepository(SubscriptionPlan)
    private readonly plans: Repository<SubscriptionPlan>,
    @InjectRepository(SubscriptionMember)
    private readonly members: Repository<SubscriptionMember>,
    private readonly registry: PaymentProviderRegistry,
    private readonly entitlements: EntitlementService,
    private readonly config: ConfigService,
    private readonly billing: BillingService,
  ) {}

  /**
   * Open a checkout for `planId`. The provider is resolved server-side from the
   * caller's platform + country (never chosen by the user) — see
   * `providerPreference`.
   *
   * Idempotent on double-click: an existing INCOMPLETE subscription is reused
   * (and its provider idempotency key is stable), and an already-live
   * subscription is rejected rather than duplicated. The real invoice/payment
   * rows are created by the provider webhook — we only stage the subscription
   * here.
   */
  async createCheckout(options: CreateCheckoutOptions): Promise<CreateCheckoutResponse> {
    const { userId, userEmail, userCountry, planId, platform, returnDeepLink } = options;

    const candidates = this.registry.checkoutCandidates({
      platform,
      country: userCountry,
      requested: options.provider,
    });

    // Take the best-ranked provider that the plan actually has a synced price
    // for, so a newly-enabled provider with no prices yet can't strand checkout.
    const prices = await this.prices.find({ where: { planId, active: true } });
    const price = candidates
      .map((key) => prices.find((p) => p.provider === key))
      .find((p): p is PlanProviderPrice => p != null);

    if (!price) {
      const key = candidates[0];
      throw new BadRequestException(
        `Plan is not available via ${key}. Sync the plan's ${key} price first.`,
      );
    }
    const provider = this.registry.get(price.provider);
    const key = provider.key;

    // A plan's price can be edited in admin without re-syncing the provider, and
    // checkout would then charge the *old* amount for as long as nobody notices
    // — a price rise that silently never takes effect. We don't block the sale
    // over it (that would turn a pricing slip into an outage), but it must not
    // pass unrecorded. `PlanProviderSync` calls this state `out_of_date`.
    await this.warnOnPriceDrift(planId, price);

    // Reuse a live/incomplete subscription; reject an already-active one.
    const existing = await this.subscriptions.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    const live = existing.find((s) => (LIVE_STATUSES as readonly string[]).includes(s.status));
    if (live) {
      throw new ConflictException('You already have an active subscription.');
    }

    let subscription = existing.find((s) => s.status === 'INCOMPLETE') ?? null;
    if (subscription) {
      subscription.planId = planId;
      subscription.provider = key;
      subscription.currency = price.currency;
      subscription = await this.subscriptions.save(subscription);
    } else {
      subscription = await this.subscriptions.save(
        this.subscriptions.create({
          userId,
          planId,
          provider: key,
          status: 'INCOMPLETE',
          currency: price.currency,
        }),
      );
    }

    const cfg = this.config.getOrThrow<PaymentsConfig>('payments');
    const result = await provider.createCheckout({
      subscriptionId: subscription.id,
      userId,
      userEmail,
      providerCustomerId: subscription.providerCustomerId,
      providerPriceId: price.providerPriceId,
      // Required by Paystack's initialize call (Stripe ignores it).
      amountMinor: price.amountMinor,
      // Providers require absolute https URLs. When a mobile deep link is given,
      // point them at the configured web page with the deep link as a `redirect`
      // param — that page bounces the in-app browser back into the app.
      successUrl: withRedirect(cfg.checkout.successUrl, returnDeepLink),
      cancelUrl: withRedirect(cfg.checkout.cancelUrl, returnDeepLink),
      // Stable within Stripe's 24h idempotency window → double-clicks reuse it.
      idempotencyKey: `checkout:${subscription.id}:${price.providerPriceId}`,
    });

    if (result.providerCustomerId && result.providerCustomerId !== subscription.providerCustomerId) {
      subscription.providerCustomerId = result.providerCustomerId;
      await this.subscriptions.save(subscription);
    }

    return {
      url: result.url,
      clientSecret: result.clientSecret,
      providerProductId: result.providerProductId,
      appAccountToken: key === 'apple_iap' ? subscription.id : null,
      provider: key,
    };
  }

  /**
   * Log loudly when the provider will charge something other than the catalog
   * price. Never throws: the learner is mid-checkout and the amount they were
   * shown still gets charged — this is for whoever reads the logs.
   */
  private async warnOnPriceDrift(planId: string, price: PlanProviderPrice): Promise<void> {
    try {
      const plan = await this.plans.findOne({ where: { id: planId } });
      if (!plan) return;
      const expected = planRecurring(plan, price.currency.toUpperCase() as CurrencyCode);
      if (!expected || expected.amountMinor === price.amountMinor) return;
      this.logger.error(
        `Plan ${plan.id} ("${plan.name}") is out of date on ${price.provider}: charging ` +
          `${price.amountMinor} ${price.currency} but the catalog says ${expected.amountMinor}. ` +
          `Re-sync the plan in admin — every checkout until then bills the old amount.`,
      );
    } catch {
      // Diagnostics must never break a checkout.
    }
  }

  /** Poll target for the client after checkout (Rule 10a) + manage screen. */
  async getMySubscription(
    userId: string,
  ): Promise<SubscriptionSummary & { entitled: boolean }> {
    const [summary, entitled] = await Promise.all([
      this.entitlements.getSummary(userId),
      this.entitlements.isEntitled(userId),
    ]);
    return { ...summary, entitled };
  }

  /**
   * Link a StoreKit purchase to the caller's pending Apple checkout. Apple IAP
   * has no hosted checkout to bounce back from, so the client calls this right
   * after `requestPurchase` resolves — this is the only path that links the
   * *first* purchase (ASSN v2 webhooks keep it in sync from then on).
   */
  async verifyAppleTransaction(
    userId: string,
    transactionId: string,
  ): Promise<SubscriptionSummary & { entitled: boolean }> {
    await this.billing.linkAppleTransaction(userId, transactionId);
    return this.getMySubscription(userId);
  }

  /**
   * Cancel at period end (Rule 5c): access is retained until the current period
   * ends. Only the caller's own subscription can be cancelled (Rule 9d — the
   * lookup is scoped to `userId`).
   */
  async cancel(userId: string): Promise<SubscriptionSummary & { entitled: boolean }> {
    const rows = await this.subscriptions.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    const sub = rows.find((s) => (LIVE_STATUSES as readonly string[]).includes(s.status));
    if (!sub) throw new NotFoundException('No active subscription to cancel.');
    if (!sub.providerSubscriptionId) {
      throw new BadRequestException('Subscription is not yet linked to the provider.');
    }

    const provider = this.registry.get(sub.provider);
    await provider.cancelSubscription(sub.providerSubscriptionId, true);

    // Optimistic mirror; the provider webhook will confirm.
    sub.cancelAtPeriodEnd = true;
    await this.subscriptions.save(sub);
    this.entitlements.invalidate(userId);

    return this.getMySubscription(userId);
  }

  /**
   * Move a live subscription onto another plan.
   *
   * Deliberately not checkout: checkout opens a *new* subscription and is
   * rejected outright while one is live (409). Changing plan keeps the same
   * subscription — and its billing anchor — so the learner is never charged a
   * fresh full period for switching.
   *
   * Timing is the whole design. An upgrade is applied now and the provider
   * invoices the prorated difference, because the learner is asking to have
   * more immediately. A downgrade is *scheduled* for the end of the period they
   * have already paid for: taking the bigger plan away the moment they ask
   * would be charging them for access we then removed. `pendingPlanId` holds
   * that promise until the renewal lands (see BillingService.applyInvoicePaid).
   *
   * Apple is the exception on both counts — see the `apple_iap` branch.
   */
  async changePlan(options: ChangePlanOptions): Promise<ChangePlanResponse> {
    const { userId, planId, confirmRemovesSeats } = options;

    const rows = await this.subscriptions.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    // Scoped to the caller's own rows (Rule 9d) — a family *member* has no
    // subscription of their own, so they land here rather than being allowed to
    // change the plan somebody else pays for.
    const sub = rows.find((s) => (LIVE_STATUSES as readonly string[]).includes(s.status));
    if (!sub) {
      throw new NotFoundException(
        'You do not have a subscription to change. Choose a plan to subscribe first.',
      );
    }
    if (!sub.providerSubscriptionId) {
      throw new BadRequestException('Subscription is not yet linked to the provider.');
    }
    if (sub.cancelAtPeriodEnd || sub.status === 'CANCELED') {
      throw new BadRequestException(
        'This plan is already set to end. Let it run out, then subscribe to the plan you want.',
      );
    }

    const [current, target] = await Promise.all([
      this.plans.findOne({ where: { id: sub.planId } }),
      this.plans.findOne({ where: { id: planId } }),
    ]);
    if (!target) throw new NotFoundException('Plan not found.');
    if (!current) {
      throw new BadRequestException('Your current plan is no longer in the catalog.');
    }
    if (!target.premium) {
      throw new BadRequestException('Cancel your subscription to move back to the free plan.');
    }

    const direction = planChangeDirection(
      { id: current.id, scope: current.scope, period: current.period as PlanPeriod },
      { id: target.id, scope: target.scope, period: target.period as PlanPeriod },
    );
    if (direction === 'same') {
      throw new BadRequestException('You are already on that plan.');
    }

    await this.assertFamilySeatsFreed(sub, current, target, confirmRemovesSeats === true);

    const price = await this.prices.findOne({
      where: { planId, provider: sub.provider, active: true },
    });
    if (!price) {
      throw new BadRequestException(
        `That plan is not available via ${sub.provider} yet. Sync its ${sub.provider} price first.`,
      );
    }

    if (sub.provider === 'apple_iap') {
      // Apple owns the money here: only the subscriber can change an IAP
      // subscription, from inside the app. Hand the client the product to buy
      // in the same subscription group — StoreKit applies an upgrade
      // immediately and a downgrade at renewal, matching what we do ourselves
      // for card providers — and let the resulting notification (and the
      // client's own verify call) move `plan_id`.
      return {
        mode: 'store',
        direction,
        planId,
        effectiveAt: null,
        providerProductId: price.providerPriceId,
        appAccountToken: sub.id,
        provider: sub.provider,
      };
    }

    // A subscription's currency is fixed once it exists — no card provider will
    // re-denominate a live subscription. Caught here rather than as a provider
    // error, which would surface to the learner as an unexplained failure.
    if (price.currency.toLowerCase() !== sub.currency.toLowerCase()) {
      throw new BadRequestException(
        'That plan is priced in a different currency from your subscription.',
      );
    }

    const immediate = direction === 'upgrade';
    await this.registry.get(sub.provider).changePlan({
      providerSubscriptionId: sub.providerSubscriptionId,
      providerPriceId: price.providerPriceId,
      immediate,
      // Stable per (subscription, target price, timing) so a double-tap that
      // reaches the provider twice doesn't invoice the difference twice.
      idempotencyKey: `change:${sub.id}:${price.providerPriceId}:${immediate ? 'now' : 'renewal'}`,
    });

    const effectiveAt = immediate ? null : sub.currentPeriodEnd;
    if (immediate) {
      sub.planId = planId;
      sub.pendingPlanId = null;
      sub.pendingPlanEffectiveAt = null;
    } else {
      sub.pendingPlanId = planId;
      sub.pendingPlanEffectiveAt = sub.currentPeriodEnd;
    }
    await this.subscriptions.save(sub);

    // An upgrade changes what the plan grants right now, for the owner and for
    // anyone holding a seat on it (Rule 5b).
    this.entitlements.invalidate(userId);
    if (immediate) await this.invalidateSeatHolders(sub.id);

    return {
      mode: immediate ? 'applied' : 'scheduled',
      direction,
      planId,
      effectiveAt: effectiveAt ? effectiveAt.toISOString() : null,
      providerProductId: null,
      appAccountToken: null,
      provider: sub.provider,
    };
  }

  /**
   * Don't let a plan change end other people's access behind the owner's back.
   *
   * Their seats stop entitling the moment the change takes effect (see
   * `EntitlementService.sharedSubscriptions`), and they'd find out by losing
   * access. So the change is refused until the caller has explicitly said yes
   * to that — `confirmed` comes from a dialog that names the people involved.
   * Confirming does not end the seats now: they run until the change itself
   * does, at the end of the period already paid for.
   *
   * Pending invitations count as well as accepted members. They are seats in
   * every sense that matters here — the person on the other end is expecting
   * access — and leaving one outstanding would let it be redeemed onto a plan
   * that no longer shares anything.
   */
  private async assertFamilySeatsFreed(
    sub: Subscription,
    current: SubscriptionPlan,
    target: SubscriptionPlan,
    confirmed: boolean,
  ): Promise<void> {
    const sharesToday = current.features?.includes('family_sharing');
    const sharesAfter = target.features?.includes('family_sharing');
    if (!sharesToday || sharesAfter) return;

    const seats = await this.members.find({
      where: { subscriptionId: sub.id, revokedAt: IsNull() },
    });
    if (seats.length === 0 || confirmed) return;

    // Name both plans and spell out what is actually on the plan. A bare count
    // reads as a seat number ("but my plan has 6?") when the point is that
    // these are the specific people the owner added.
    const accepted = seats.filter((s) => s.acceptedAt).length;
    const invited = seats.length - accepted;
    const detail = [
      accepted > 0 ? `${accepted} ${accepted === 1 ? 'person' : 'people'}` : null,
      invited > 0
        ? `${invited} pending ${invited === 1 ? 'invitation' : 'invitations'}`
        : null,
    ]
      .filter((part): part is string => part !== null)
      .join(' and ');

    // Reached only when the client asked without confirming — an out-of-date
    // app, or a direct API call. The in-app path shows the dialog instead.
    throw new BadRequestException(
      `${target.name} only covers your own account, and your ${current.name} still has ${detail} on it. Confirm the change to end their access, or remove them from Family plan settings first.`,
    );
  }

  /** Drop the cached entitlement of everyone holding a seat on a subscription. */
  private async invalidateSeatHolders(subscriptionId: string): Promise<void> {
    const seats = await this.members.find({
      where: { subscriptionId, acceptedAt: Not(IsNull()), revokedAt: IsNull() },
    });
    for (const seat of seats) {
      if (seat.userId) this.entitlements.invalidate(seat.userId);
    }
  }

  /** Cross-user list for the admin subscriptions table. */
  async listForAdmin(): Promise<AdminSubscription[]> {
    const rows = await this.subscriptions
      .createQueryBuilder('sub')
      .leftJoin('users', 'u', 'u.id = sub.user_id')
      .leftJoin('subscription_plans', 'p', 'p.id = sub.plan_id')
      .select('sub.id', 'id')
      .addSelect('sub.user_id', 'userId')
      .addSelect('u.email', 'userEmail')
      .addSelect('u.display_name', 'userDisplayName')
      .addSelect('sub.plan_id', 'planId')
      .addSelect('p.name', 'planName')
      .addSelect('sub.provider', 'provider')
      .addSelect('sub.status', 'status')
      .addSelect('sub.current_period_start', 'currentPeriodStart')
      .addSelect('sub.current_period_end', 'currentPeriodEnd')
      .addSelect('sub.cancel_at_period_end', 'cancelAtPeriodEnd')
      .addSelect('sub.created_at', 'createdAt')
      // Hide abandoned/in-flight checkouts — only surface real subscriptions.
      .where('sub.status != :incomplete', { incomplete: 'INCOMPLETE' })
      .orderBy('sub.created_at', 'DESC')
      .getRawMany<{
        id: string;
        userId: string;
        userEmail: string | null;
        userDisplayName: string | null;
        planId: string;
        planName: string | null;
        provider: ProviderKey;
        status: SubscriptionStatus;
        currentPeriodStart: Date | null;
        currentPeriodEnd: Date | null;
        cancelAtPeriodEnd: boolean;
        createdAt: Date;
      }>();

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.userEmail ?? '',
      userDisplayName: r.userDisplayName ?? '',
      planId: r.planId,
      planName: r.planName,
      provider: r.provider,
      status: r.status,
      statusText: SUBSCRIPTION_STATUS_TEXT[r.status],
      currentPeriodStart: r.currentPeriodStart ? r.currentPeriodStart.toISOString() : null,
      currentPeriodEnd: r.currentPeriodEnd ? r.currentPeriodEnd.toISOString() : null,
      cancelAtPeriodEnd: r.cancelAtPeriodEnd,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
