import type { AnalyticsRevenue } from '@lexiroot/shared';
import { PeriodPill } from './PeriodPill';
import { Sparkline } from './Sparkline';
import { formatCurrency } from '../../../utils/format';

interface Props {
  revenue?: AnalyticsRevenue;
}

export function RevenueOverviewCard({ revenue }: Props) {
  const total = revenue?.totalRevenue ?? 0;
  const paid = revenue?.paidSubscriptionRevenue ?? 0;
  const spark = revenue?.spark ?? [];

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral">Revenue Overview</h3>
        <PeriodPill />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] items-start gap-4">
        <div>
          <div className="font-display text-2xl font-extrabold text-neutral">
            {formatCurrency(total)}
          </div>
          <div className="text-xs text-neutral-variant">Total Revenue</div>
          <div className="mt-3 h-20 w-full">
            {spark.length > 0 ? <Sparkline data={spark} color="#16A34A" /> : null}
          </div>
        </div>

        <div className="rounded-xl bg-success/10 px-4 py-3 text-right">
          <div className="font-display text-lg font-extrabold text-success">
            {formatCurrency(paid)}
          </div>
          <div className="text-[11px] text-neutral-variant">Paid subscription</div>
        </div>
      </div>
    </div>
  );
}
