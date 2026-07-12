import { BASE_CURRENCY, type CurrencyCode, toMinorUnits } from '@lexiroot/shared';
import type { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';

/**
 * Maps a catalog plan onto a recurring provider price, in a given currency. The
 * plan's `period` (Month/Quarter/Year) is the source of truth for the billing
 * interval, and its `price` is the amount charged once per that period. USD
 * amounts live in `price`; other currencies in `prices`.
 *
 * Shared by the sync service (which provisions the price) and the sync-state
 * reporter (which detects drift). They must agree, so this lives in one place.
 */
export interface RecurringPrice {
  amountMinor: number;
  interval: 'month' | 'year';
  intervalCount: number;
}

/** The plan's per-period amount in `currency`, or null if not priced in it. */
function priceFor(plan: SubscriptionPlan, currency: CurrencyCode): number | null {
  if (currency === BASE_CURRENCY) return Number(plan.price);
  const override = plan.prices?.[currency];
  return override ? override.price : null;
}

/** A plan period → the provider (interval, count) it bills on. */
function intervalForPeriod(period: string): Pick<RecurringPrice, 'interval' | 'intervalCount'> {
  switch (period) {
    case 'Year':
      return { interval: 'year', intervalCount: 1 };
    case 'Quarter':
      return { interval: 'month', intervalCount: 3 };
    default: // 'Month'
      return { interval: 'month', intervalCount: 1 };
  }
}

/**
 * Recurring price in `currency`, or null when the plan carries no price in it
 * (so the caller can skip that provider rather than charge the wrong amount).
 */
export function planRecurring(
  plan: SubscriptionPlan,
  currency: CurrencyCode,
): RecurringPrice | null {
  const price = priceFor(plan, currency);
  if (price === null) return null;
  const { interval, intervalCount } = intervalForPeriod(plan.period);
  return { amountMinor: toMinorUnits(price, currency), interval, intervalCount };
}

/** The `interval` string persisted on a PlanProviderPrice row, e.g. "3month". */
export function intervalLabel({ interval, intervalCount }: RecurringPrice): string {
  return `${intervalCount === 1 ? '' : intervalCount}${interval}`;
}
