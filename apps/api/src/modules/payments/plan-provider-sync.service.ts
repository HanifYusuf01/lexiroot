import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  PlanProviderSync,
  PlanProviderSyncMap,
  PlanSyncState,
  ProviderKey,
} from '@lexiroot/shared';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { PlanProviderPrice } from './entities/plan-provider-price.entity';
import { deriveRecurring, intervalLabel } from './plan-pricing';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';

// Until per-plan currency lands, all provider prices are provisioned in USD.
const DEFAULT_CURRENCY = 'usd';

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

    const recurring = deriveRecurring(plan);
    if (recurring.amountMinor <= 0) {
      throw new BadRequestException('Cannot sync a free (zero-amount) plan to a provider.');
    }

    const existing = await this.prices.findOne({ where: { planId, provider: key } });

    const result = await provider.syncPlanPrice({
      planName: `${plan.name} (${plan.scope})`,
      amountMinor: recurring.amountMinor,
      currency: DEFAULT_CURRENCY,
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
   * Sync state for every plan against every live provider, so admin can show
   * which plans are actually purchasable. Reported per provider (not just
   * Stripe) and only for providers that can take a payment today — an
   * unimplemented stub isn't something an admin can act on.
   *
   * Free plans get an empty list: `sync()` rejects a zero-amount plan, so there
   * is no state an admin could act on and nothing honest to render.
   */
  async listSyncState(): Promise<PlanProviderSyncMap> {
    const [plans, prices] = await Promise.all([
      this.plans.find(),
      this.prices.find({ where: { active: true } }),
    ]);
    const liveProviders = this.registry.availableProviders().map((p) => p.key);

    const map: PlanProviderSyncMap = {};
    for (const plan of plans) {
      const expectedAmountMinor = deriveRecurring(plan).amountMinor;
      map[plan.id] =
        expectedAmountMinor <= 0
          ? []
          : liveProviders.map((provider) =>
              this.syncStateFor(plan, provider, expectedAmountMinor, prices),
            );
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
      currency: price?.currency ?? null,
      syncedAt: price?.updatedAt.toISOString() ?? null,
    };
  }
}
