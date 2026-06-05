import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SubscriptionGrowthPoint } from '@lexiroot/shared';

interface Props {
  data: SubscriptionGrowthPoint[];
}

const SERIES = [
  { key: 'newPremium', label: 'New Premium', color: '#16A34A' },
  { key: 'cancellations', label: 'Cancellations', color: '#E35336' },
  { key: 'renewals', label: 'Renewals', color: '#3B82F6' },
] as const;

const PERIODS = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'] as const;

export function SubscriptionGrowthChart({ data }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-neutral">Subscription growth</h3>
          <p className="text-xs text-neutral-variant">
            New subscribers, cancellations, renewals, net growth
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-neutral-variant">
          {PERIODS.map((p, i) => (
            <span key={p} className={i === 0 ? 'font-semibold text-neutral' : ''}>
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4">
        {SERIES.map((s) => (
          <span
            key={s.key}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-variant"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="mt-3 h-56 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #E5E5E5', fontSize: 12 }}
              cursor={{ stroke: '#E5E5E5' }}
            />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
