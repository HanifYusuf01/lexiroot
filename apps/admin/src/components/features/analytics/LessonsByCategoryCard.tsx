import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { AnalyticsCategoryBreakdown } from '@lexiroot/shared';
import { formatNumber } from '../../../utils/format';

interface Props {
  data?: AnalyticsCategoryBreakdown;
}

const PLACEHOLDER_COLOR = '#F5F5F5';

export function LessonsByCategoryCard({ data }: Props) {
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const withValue = items.filter((i) => i.count > 0);
  const chartData =
    withValue.length > 0
      ? withValue.map((i) => ({ value: i.count, color: i.color }))
      : [{ value: 1, color: PLACEHOLDER_COLOR }];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-5">
      <h3 className="text-sm font-bold text-neutral">Lessons completed by category</h3>

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
            <span className="text-[11px] text-neutral-variant">Total</span>
          </div>
        </div>

        <ul className="flex flex-1 flex-col gap-2">
          {items.map((it) => (
            <li key={it.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 text-neutral-variant">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: it.color }}
                />
                {it.label}
              </span>
              <span className="whitespace-nowrap font-semibold text-neutral">
                {it.percent}%{' '}
                <span className="font-normal text-neutral-variant">({formatNumber(it.count)})</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
