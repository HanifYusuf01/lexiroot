import type { AnalyticsRevenuePlan } from '@lexiroot/shared';
import { PeriodPill } from './PeriodPill';
import { formatCurrency, formatNumber } from '../../../utils/format';

interface Props {
  plans: AnalyticsRevenuePlan[];
}

export function RevenueBreakdownCard({ plans }: Props) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral">Revenue Breakdown</h3>
        <PeriodPill />
      </div>

      <ul className="mt-4 flex flex-col">
        {plans.map((plan) => (
          <li
            key={plan.plan}
            className="flex items-center justify-between border-b border-border py-3 last:border-b-0"
          >
            <div>
              <div className="text-sm font-semibold text-neutral">{plan.plan}</div>
              <div className="text-[11px] text-neutral-variant">
                {formatNumber(plan.users)} users
              </div>
            </div>
            <span className="font-display text-sm font-extrabold text-neutral">
              {formatCurrency(plan.revenue)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
