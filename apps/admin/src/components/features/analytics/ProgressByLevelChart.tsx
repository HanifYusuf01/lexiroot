import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsLevelProgress } from '@lexiroot/shared';
import { PeriodPill } from './PeriodPill';

interface Props {
  data: AnalyticsLevelProgress[];
}

const COMPLETED_COLOR = '#E35336';
const IN_PROGRESS_COLOR = '#F3B2A5';

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-variant">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function ProgressByLevelChart({ data }: Props) {
  const chartData = data.map((d) => ({
    label: d.label,
    Completed: d.completed,
    'In Progress': d.inProgress,
  }));

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral">User Progress by Level</h3>
        <PeriodPill />
      </div>

      <div className="mt-2 flex items-center gap-4">
        <LegendDot color={COMPLETED_COLOR} label="Completed" />
        <LegendDot color={IN_PROGRESS_COLOR} label="In Progress" />
      </div>

      <div className="mt-3 h-56 w-full">
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
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
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #E5E5E5', fontSize: 12 }}
              cursor={{ fill: '#F5F5F5' }}
            />
            <Bar dataKey="Completed" fill={COMPLETED_COLOR} radius={[4, 4, 0, 0]} maxBarSize={26}>
              <LabelList
                dataKey="Completed"
                position="top"
                style={{ fontSize: 10, fill: '#7A7878', fontWeight: 700 }}
              />
            </Bar>
            <Bar
              dataKey="In Progress"
              fill={IN_PROGRESS_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={26}
            >
              <LabelList
                dataKey="In Progress"
                position="top"
                style={{ fontSize: 10, fill: '#7A7878', fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
