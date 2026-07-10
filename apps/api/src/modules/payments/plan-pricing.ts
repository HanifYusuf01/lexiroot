import { BASE_CURRENCY, type CurrencyCode, toMinorUnits } from '@lexiroot/shared';
import type { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';

/**
 * Maps a catalog plan onto a recurring provider price, in a given currency. The
 * catalog stores a per-month headline `price` and a `total` billed for
 * multi-month periods; the provider price charges `total` (or `price`) once per
 * interval. USD amounts live in `price`/`total`; other currencies in `prices`.
 *
 * Shared by the sync service (which provisions the price) and the sync-state
 * reporter (which detects drift). They must agree, so this lives in one place.
 */
export interface RecurringPrice {
  amountMinor: number;
  interval: 'month' | 'year';
  intervalCount: number;
}

/** The plan's headline + total amount in `currency`, or null if not priced. */
function amountsFor(
  plan: SubscriptionPlan,
  currency: CurrencyCode,
): { price: number; total: number | null } | null {
  if (currency === BASE_CURRENCY) {
    return { price: Number(plan.price), total: plan.total === null ? null : Number(plan.total) };
  }
  return plan.prices?.[currency] ?? null;
}

/**
 * Recurring price in `currency`, or null when the plan carries no price in it
 * (so the caller can skip that provider rather than charge the wrong amount).
 */
export function planRecurring(
  plan: SubscriptionPlan,
  currency: CurrencyCode,
): RecurringPrice | null {
  const amounts = amountsFor(plan, currency);
  if (!amounts) return null;

  const { price, total } = amounts;
  const name = plan.name.toLowerCase();
  const minor = (major: number) => toMinorUnits(major, currency);

  if (name.includes('year') || name.includes('annual')) {
    return { amountMinor: minor(total ?? price * 12), interval: 'year', intervalCount: 1 };
  }
  if (name.includes('quarter')) {
    return { amountMinor: minor(total ?? price * 3), interval: 'month', intervalCount: 3 };
  }
  // Default: monthly.
  return { amountMinor: minor(price), interval: 'month', intervalCount: 1 };
}

/** The `interval` string persisted on a PlanProviderPrice row, e.g. "3month". */
export function intervalLabel({ interval, intervalCount }: RecurringPrice): string {
  return `${intervalCount === 1 ? '' : intervalCount}${interval}`;
}
