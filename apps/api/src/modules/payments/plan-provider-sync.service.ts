import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  type CurrencyCode,
  type PlanProviderSync,
  type PlanProviderSyncMap,
  type PlanSyncResult,
  type PlanSyncState,
  type ProviderKey,
} from '@lexiroot/shared';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { PlanProviderPrice } from './entities/plan-provider-price.entity';
import { intervalLabel, planRecurring } from './plan-pricing';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';

/**
 * Currency each provider bills in. A provider account is tied to its currency
 * (Stripe → USD here; Paystack's Nigerian account → NGN), so a plan is sold via
 * a provider only when it carries a price in that provider's currency.
 */
const PROVIDER_CURRENCY: Record<ProviderKey, CurrencyCode> = {
  stripe: 'USD',
  paystack: 'NGN',
  apple_iap: 'USD',
};

/**
 * Provisions a provider price/product from a catalog plan and records the
 * mapping in `plan_provider_prices`. Idempotent: re-syncing reuses the product
 * and only mints a new price when the amount/interval actually changed. Admin
 * only — this is how a plan becomes purchasable via a provider.
 */
@Injectable()
export class PlanProviderSyncService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly plans: Repository<SubscriptionPlan>,
    @InjectRepository(PlanProviderPrice)
    private readonly prices: Repository<PlanProviderPrice>,
    private readonly registry: PaymentProviderRegistry,
  ) {}

  async sync(planId: string, providerKey?: ProviderKey): Promise<PlanProviderPrice> {
    const plan = await this.plans.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const provider = this.registry.resolve(providerKey);
    const key = provider.key;
    const currency = PROVIDER_CURRENCY[key];

    const recurring = planRecurring(plan, currency);
    if (!recurring) {
      throw new BadRequestException(
        `Plan "${plan.name}" has no ${currency} price — add one before syncing to ${key}.`,
      );
    }
    if (recurring.amountMinor <= 0) {
      throw new BadRequestException('Cannot sync a free (zero-amount) plan to a provider.');
    }

    const existing = await this.prices.findOne({ where: { planId, provider: key } });

    const result = await provider.syncPlanPrice({
      planName: `${plan.name} (${plan.scope})`,
      amountMinor: recurring.amountMinor,
      currency,
      interval: recurring.interval,
      intervalCount: recurring.intervalCount,
      existingProductId: existing?.providerProductId ?? null,
      existingPriceId: existing?.providerPriceId ?? null,
    });

    const row =
      existing ??
      this.prices.create({ planId, provider: key });
    row.providerProductId = result.providerProductId;
    row.providerPriceId = result.providerPriceId;
    row.amountMinor = result.amountMinor;
    row.currency = result.currency;
    row.interval = intervalLabel(recurring);
    row.active = true;
    return this.prices.save(row);
  }

  /**
   * Sync a plan to every live provider at once (the admin default). Resilient:
   * one provider failing (e.g. Paystack rejecting an unsupported interval) does
   * not abort the others, and each outcome is reported so the UI can surface a
   * partial success. Free plans have nothing to sell, so they return an empty
   * list rather than N failures.
   */
  async syncAll(planId: string): Promise<PlanSyncResult[]> {
    const plan = await this.plans.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    // Free plans have nothing to sell — no rows, no failures.
    const base = planRecurring(plan, PROVIDER_CURRENCY.stripe);
    if (!base || base.amountMinor <= 0) return [];

    const results: PlanSyncResult[] = [];
    for (const provider of this.registry.availableProviders()) {
      const currency = PROVIDER_CURRENCY[provider.key];
      // A provider whose currency the plan isn't priced in is simply not part of
      // this plan's distribution — skip it rather than fail.
      if (!planRecurring(plan, currency)) {
        results.push({
          provider: provider.key,
          status: 'skipped',
          error: `No ${currency} price set for this plan.`,
        });
        continue;
      }
      try {
        await this.sync(planId, provider.key);
        results.push({ provider: provider.key, status: 'synced', error: null });
      } catch (err) {
        results.push({
          provider: provider.key,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return results;
  }

  /**
   * Sync state for every plan against every live provider, so admin can show
   * which plans are actually purchasable. Reported per provider (not just
   * Stripe) and only for providers that can take a payment today — an
   * unimplemented stub isn't something an admin can act on.
   *
   * A provider is reported only when the plan is priced in that provider's
   * currency — otherwise the plan simply isn't sold there and there is nothing
   * to act on. Free plans get an empty list.
   */
  async listSyncState(): Promise<PlanProviderSyncMap> {
    const [plans, prices] = await Promise.all([
      this.plans.find(),
      this.prices.find({ where: { active: true } }),
    ]);
    const liveProviders = this.registry.availableProviders().map((p) => p.key);

    const map: PlanProviderSyncMap = {};
    for (const plan of plans) {
      const states: PlanProviderSync[] = [];
      for (const provider of liveProviders) {
        const recurring = planRecurring(plan, PROVIDER_CURRENCY[provider]);
        if (!recurring || recurring.amountMinor <= 0) continue; // not priced / free
        states.push(this.syncStateFor(plan, provider, recurring.amountMinor, prices));
      }
      map[plan.id] = states;
    }
    return map;
  }

  private syncStateFor(
    plan: SubscriptionPlan,
    provider: ProviderKey,
    expectedAmountMinor: number,
    prices: PlanProviderPrice[],
  ): PlanProviderSync {
    const price = prices.find((p) => p.planId === plan.id && p.provider === provider) ?? null;

    let state: PlanSyncState;
    if (!price) {
      state = 'not_synced';
    } else {
      state = price.amountMinor === expectedAmountMinor ? 'synced' : 'out_of_date';
    }

    return {
      provider,
      state,
      syncedAmountMinor: price?.amountMinor ?? null,
      expectedAmountMinor,
      currency: price?.currency ?? PROVIDER_CURRENCY[provider],
      syncedAt: price?.updatedAt.toISOString() ?? null,
    };
  }
}
