import type { AnalyticsActiveUsers } from '@lexiroot/shared';
import { formatNumber } from '../../../utils/format';

interface Props {
  activeUsers?: AnalyticsActiveUsers;
  activeStreaks?: number;
  loading?: boolean;
}

const ITEMS: { key: keyof AnalyticsActiveUsers | 'streaks'; label: string; hint: string }[] = [
  { key: 'dau', label: 'Daily active', hint: 'Today' },
  { key: 'wau', label: 'Weekly active', hint: 'Last 7 days' },
  { key: 'mau', label: 'Monthly active', hint: 'Last 30 days' },
  { key: 'streaks', label: 'Active streaks', hint: 'Users on a streak' },
];

export function AudienceSummary({ activeUsers, activeStreaks, loading }: Props) {
  const value = (key: string): number => {
    if (key === 'streaks') return activeStreaks ?? 0;
    return activeUsers?.[key as keyof AnalyticsActiveUsers] ?? 0;
  };

  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-4">
      {ITEMS.map((item) => (
        <div key={item.key} className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-neutral-variant">{item.label}</span>
          <span className="font-display text-2xl font-extrabold text-neutral">
            {loading ? '—' : formatNumber(value(item.key))}
          </span>
          <span className="text-[11px] text-neutral-variant">{item.hint}</span>
        </div>
      ))}
    </div>
  );
}
