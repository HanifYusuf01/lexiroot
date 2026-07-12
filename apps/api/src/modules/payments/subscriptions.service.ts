import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  type AdminSubscription,
  type ClientPlatform,
  type CountryCode,
  type CreateCheckoutResponse,
  type ProviderKey,
  type SubscriptionStatus,
  SUBSCRIPTION_STATUS_TEXT,
  type SubscriptionSummary,
} from '@lexiroot/shared';
import type { PaymentsConfig } from '../../config/payments.config';
import { EntitlementService } from './entitlement.service';
import { PlanProviderPrice } from './entities/plan-provider-price.entity';
import { Subscription } from './entities/subscription.entity';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';

/** Statuses that mean the user already has (or is finishing paying for) a plan. */
const LIVE_STATUSES = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'PAUSED'] as const;

/** Append a `redirect` deep link to a checkout return URL when provided. */
function withRedirect(baseUrl: string, deepLink?: string): string {
  if (!deepLink) return baseUrl;
  const sep = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${sep}redirect=${encodeURIComponent(deepLink)}`;
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
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(PlanProviderPrice)
    private readonly prices: Repository<PlanProviderPrice>,
    private readonly registry: PaymentProviderRegistry,
    private readonly entitlements: EntitlementService,
    private readonly config: ConfigService,
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

    return { url: result.url, clientSecret: result.clientSecret, provider: key };
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
      currentPeriodEnd: r.currentPeriodEnd ? r.currentPeriodEnd.toISOString() : null,
      cancelAtPeriodEnd: r.cancelAtPeriodEnd,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
