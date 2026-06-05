import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RevenueOverTimePoint } from '@lexiroot/shared';

interface Props {
  data: RevenueOverTimePoint[];
}

const SERIES = [
  { key: 'revenue', label: 'Revenue', color: '#E35336' },
  { key: 'mrr', label: 'MRR', color: '#3B82F6' },
  { key: 'renewals', label: 'Renewals', color: '#16A34A' },
] as const;

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-variant">
      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function RevenueOverTimeChart({ data }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-neutral">Revenue overview</h3>
          <p className="text-xs text-neutral-variant">
            Revenue, MRR, and subscription renewals over time
          </p>
        </div>
        <div className="flex items-center gap-4">
          {SERIES.map((s) => (
            <LegendItem key={s.key} color={s.color} label={s.label} />
          ))}
        </div>
      </div>

      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="#F1F1F1" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#7A7878' }}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#7A7878' }}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
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
