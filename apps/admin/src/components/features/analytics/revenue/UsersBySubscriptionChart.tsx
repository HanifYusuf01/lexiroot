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

const CHART_FREE_COLOR = '#EEEEEE';
const MONTHLY_COLOR = '#E95237';
const ANNUAL_COLOR = '#F6B4A9';

function percentOf(rows: { plan: string; users: number }[], plan: string, fallback: number): number {
  const premiumTotal = rows
    .filter((row) => row.plan.toLowerCase().includes('premium'))
    .reduce((sum, row) => sum + row.users, 0);
  const planUsers = rows.find((row) => row.plan === plan)?.users ?? 0;
  return premiumTotal > 0 ? planUsers / premiumTotal : fallback;
}

export function UsersBySubscriptionChart({ data, breakdown }: Props) {
  const rows = breakdown?.rows ?? [];
  const monthlyShare = percentOf(rows, 'Premium Monthly', 0.72);
  const chartData = data.map((point) => ({
    ...point,
    premiumMonthly: Math.round(point.premium * monthlyShare),
    premiumAnnual: point.premium - Math.round(point.premium * monthlyShare),
  }));

  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-base font-extrabold text-black">Users by subscription</h3>
        <p className="mt-1 text-xs text-neutral-variant">Free vs Premium distribution</p>
      </div>

      <div className="grid gap-5 rounded-xl border border-border bg-white p-6 sm:grid-cols-[1fr_11rem] sm:items-center">
        <div className="h-52 w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
              <Bar dataKey="free" stackId="a" fill={CHART_FREE_COLOR} maxBarSize={18} />
              <Bar dataKey="premiumMonthly" stackId="a" fill={MONTHLY_COLOR} maxBarSize={18} />
              <Bar
                dataKey="premiumAnnual"
                stackId="a"
                fill={ANNUAL_COLOR}
                radius={[0, 0, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="sm:w-44">
          <div className="text-xs font-extrabold text-black">Plan Breakdown</div>
          <ul className="mt-3 flex flex-col gap-2">
            {rows.map((row) => (
              <li key={row.plan} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-black">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{
                      backgroundColor:
                        row.plan === 'Free'
                          ? CHART_FREE_COLOR
                          : row.plan === 'Premium Monthly'
                            ? MONTHLY_COLOR
                            : ANNUAL_COLOR,
                    }}
                  />
                  {row.plan}
                </span>
                <span className="font-semibold text-neutral">
                  {formatNumber(row.users)}{' '}
                  <span className="font-normal text-neutral-variant">{row.percent}%</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-border pt-5">
            <div className="text-[11px] text-neutral-variant">Total Premium</div>
            <div className="font-display text-lg font-extrabold text-primary">
              {formatNumber(breakdown?.totalPremium ?? 0)}{' '}
              <span className="text-xs font-normal text-neutral-variant">
                {breakdown?.totalPremiumPercent ?? 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
