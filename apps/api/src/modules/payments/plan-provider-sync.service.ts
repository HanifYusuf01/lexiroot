import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ProviderKey } from '@lexiroot/shared';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { PlanProviderPrice } from './entities/plan-provider-price.entity';
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
    row.interval = `${recurring.intervalCount === 1 ? '' : recurring.intervalCount}${recurring.interval}`;
    row.active = true;
    return this.prices.save(row);
  }
}

/**
 * Maps a catalog plan onto a recurring price. The catalog stores a per-month
 * headline `price` and a `total` billed for multi-month periods; the provider
 * price charges `total` (or `price`) once per interval.
 */
function deriveRecurring(plan: SubscriptionPlan): {
  amountMinor: number;
  interval: 'month' | 'year';
  intervalCount: number;
} {
  const name = plan.name.toLowerCase();
  const price = Number(plan.price);
  const total = plan.total === null ? null : Number(plan.total);

  if (name.includes('year') || name.includes('annual')) {
    return { amountMinor: toMinor(total ?? price * 12), interval: 'year', intervalCount: 1 };
  }
  if (name.includes('quarter')) {
    return { amountMinor: toMinor(total ?? price * 3), interval: 'month', intervalCount: 3 };
  }
  // Default: monthly.
  return { amountMinor: toMinor(price), interval: 'month', intervalCount: 1 };
}

function toMinor(amount: number): number {
  return Math.round(amount * 100);
}
