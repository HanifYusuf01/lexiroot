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
  { key: 'newPremium', label: 'New Premium', color: '#039855' },
  { key: 'cancellations', label: 'Cancellations', color: '#E95237' },
  { key: 'renewals', label: 'Renewals', color: '#2563EB' },
] as const;

const PERIODS = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'] as const;

export function SubscriptionGrowthChart({ data }: Props) {
  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold text-black">Subscription growth</h3>
          <p className="mt-1 text-xs text-neutral-variant">
            New subscribers, cancellations, renewals, net growth
          </p>
        </div>
        <div className="flex rounded border border-border bg-white text-xs text-neutral-variant">
          {PERIODS.map((p, i) => (
            <span
              key={p}
              className={`px-2.5 py-1.5 ${i === 0 ? 'font-semibold text-neutral' : ''}`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-4">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-black">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>

        <div className="h-52 w-full">
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
                  dot={{ r: 2, strokeWidth: 0, fill: s.color }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
