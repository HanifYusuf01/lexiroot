import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ActivityPoint {
  label: string;
  active: number;
  newUsers: number;
}

interface Props {
  data: ActivityPoint[];
}

const ACTIVE_COLOR = '#1F2937';
const NEW_COLOR = '#E35336';

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-xs font-medium text-neutral-variant">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function UserActivityChart({ data }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral">User Activity</h3>
        <div className="flex items-center gap-4">
          <LegendDot color={ACTIVE_COLOR} label="Active Users" />
          <LegendDot color={NEW_COLOR} label="New Users" />
        </div>
      </div>
      <div className="mt-4 h-64 w-full">
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
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #E5E5E5',
                fontSize: 12,
              }}
              cursor={{ stroke: '#E5E5E5' }}
            />
            <Line
              type="linear"
              dataKey="active"
              name="Active Users"
              stroke={ACTIVE_COLOR}
              strokeWidth={2}
              dot={{ r: 3, fill: ACTIVE_COLOR }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="linear"
              dataKey="newUsers"
              name="New Users"
              stroke={NEW_COLOR}
              strokeWidth={2}
              dot={{ r: 3, fill: NEW_COLOR }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
