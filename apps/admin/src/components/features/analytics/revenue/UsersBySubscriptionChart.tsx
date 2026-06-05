import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { SubscriptionPlanBreakdown, UsersBySubscriptionPoint } from '@lexiroot/shared';
import { formatNumber } from '../../../../utils/format';

interface Props {
  data: UsersBySubscriptionPoint[];
  breakdown?: SubscriptionPlanBreakdown;
}

const FREE_COLOR = '#F3B2A5';
const PREMIUM_COLOR = '#E35336';

export function UsersBySubscriptionChart({ data, breakdown }: Props) {
  const rows = breakdown?.rows ?? [];

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h3 className="text-sm font-bold text-neutral">Users by subscription</h3>
      <p className="text-xs text-neutral-variant">Free vs Premium distribution</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="h-56 w-full">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#F1F1F1" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#7A7878' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#7A7878' }}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
              />
              <Bar dataKey="free" stackId="a" fill={FREE_COLOR} maxBarSize={26} />
              <Bar dataKey="premium" stackId="a" fill={PREMIUM_COLOR} radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border p-4 sm:w-56">
          <div className="text-xs font-bold text-neutral">Plan Breakdown</div>
          <ul className="mt-3 flex flex-col gap-2">
            {rows.map((row) => (
              <li key={row.plan} className="flex items-center justify-between text-xs">
                <span className="text-neutral-variant">{row.plan}</span>
                <span className="font-semibold text-neutral">
                  {formatNumber(row.users)}{' '}
                  <span className="font-normal text-neutral-variant">{row.percent}%</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-border pt-3">
            <div className="text-[11px] text-neutral-variant">Total Premium</div>
            <div className="font-display text-lg font-extrabold text-primary">
              {formatNumber(breakdown?.totalPremium ?? 0)}{' '}
              <span className="text-xs font-semibold text-neutral-variant">
                {breakdown?.totalPremiumPercent ?? 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
