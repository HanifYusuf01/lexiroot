import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { AnalyticsSubscriptionBreakdown } from '@lexiroot/shared';
import { PeriodPill } from './PeriodPill';
import { formatNumber } from '../../../utils/format';

interface Props {
  subscription?: AnalyticsSubscriptionBreakdown;
}

const FREE_COLOR = '#376DF6';
const PREMIUM_COLOR = '#1FC0E0';
const PLACEHOLDER_COLOR = '#F5F5F5';

export function UsersBySubscriptionCard({ subscription }: Props) {
  const total = subscription?.total ?? 0;
  const free = subscription?.free ?? 0;
  const premium = subscription?.premium ?? 0;

  const slices = [
    { label: 'Free Users', value: free, percent: subscription?.freePercent ?? 0, color: FREE_COLOR },
    {
      label: 'Premium',
      value: premium,
      percent: subscription?.premiumPercent ?? 0,
      color: PREMIUM_COLOR,
    },
  ];
  const hasValue = total > 0;
  const chartData = hasValue
    ? slices.filter((s) => s.value > 0)
    : [{ label: '', value: 1, percent: 0, color: PLACEHOLDER_COLOR }];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral">Users by subscription</h3>
        <PeriodPill />
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center gap-5 sm:flex-row">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-xl font-extrabold text-neutral">
              {formatNumber(total)}
            </span>
            <span className="text-[11px] text-neutral-variant">Total Users</span>
          </div>
        </div>

        <ul className="flex flex-1 flex-col gap-3">
          {slices.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 text-neutral-variant">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="whitespace-nowrap font-semibold text-neutral">
                {s.percent}%{' '}
                <span className="font-normal text-neutral-variant">({formatNumber(s.value)})</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
