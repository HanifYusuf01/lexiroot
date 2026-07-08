import type { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';

/**
 * Maps a catalog plan onto a recurring provider price. The catalog stores a
 * per-month headline `price` and a `total` billed for multi-month periods; the
 * provider price charges `total` (or `price`) once per interval.
 *
 * Shared by the sync service (which provisions the price) and the sync-state
 * reporter (which detects that a plan has drifted from its provider price). They
 * must agree, so this lives in one place.
 */
export interface RecurringPrice {
  amountMinor: number;
  interval: 'month' | 'year';
  intervalCount: number;
}

export function deriveRecurring(plan: SubscriptionPlan): RecurringPrice {
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

/** The `interval` string persisted on a PlanProviderPrice row, e.g. "3month". */
export function intervalLabel({ interval, intervalCount }: RecurringPrice): string {
  return `${intervalCount === 1 ? '' : intervalCount}${interval}`;
}

export function toMinor(amount: number): number {
  return Math.round(amount * 100);
}
