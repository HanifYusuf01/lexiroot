import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

export interface LanguageSlice {
  language: string;
  percent: number;
  color: string;
}

interface Props {
  data: LanguageSlice[];
}

const PLACEHOLDER_COLOR = '#F5F5F5';

export function TopLanguagesChart({ data }: Props) {
  const hasAnyValue = data.some((d) => d.percent > 0);
  const chartData = hasAnyValue
    ? data.map((d) => ({ ...d, value: Math.max(d.percent, 0.0001) }))
    : data.map((d) => ({ ...d, value: 1, color: PLACEHOLDER_COLOR }));

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-5">
      <h3 className="text-sm font-bold text-neutral">Top Languages</h3>
      <div className="mt-4 flex flex-1 flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="h-40 w-40 shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={0}
                stroke="none"
                isAnimationActive={false}
              >
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex flex-1 flex-col gap-3">
          {data.map((slice) => (
            <li
              key={slice.language}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 text-neutral-variant">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.language}
              </span>
              <span className="font-semibold text-neutral">{slice.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
