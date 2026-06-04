import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsLevelProgress } from '@lexiroot/shared';

interface Props {
  data: AnalyticsLevelProgress[];
}

const COMPLETED_COLOR = '#16A34A';
const IN_PROGRESS_COLOR = '#E35336';

export function ProgressByLevelChart({ data }: Props) {
  const chartData = data.map((d) => ({
    label: d.label,
    Completed: d.completed,
    'In Progress': d.inProgress,
  }));

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h3 className="text-sm font-bold text-neutral">User Progress by Level</h3>
      <div className="mt-4 h-64 w-full">
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
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #E5E5E5', fontSize: 12 }}
              cursor={{ fill: '#F5F5F5' }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => <span style={{ color: '#7A7878' }}>{value}</span>}
            />
            <Bar dataKey="Completed" fill={COMPLETED_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar
              dataKey="In Progress"
              fill={IN_PROGRESS_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
