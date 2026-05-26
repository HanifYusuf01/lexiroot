import { Flame } from 'lucide-react';
import type { StreakOverview } from '@lexiroot/shared';
import { formatNumber } from '../../../utils/format';

interface Props {
  overview?: StreakOverview;
  loading?: boolean;
}

export function StreakOverviewCard({ overview, loading }: Props) {
  const avg = overview?.avgStreakDays ?? 0;
  const longest = overview?.longestStreakDays ?? 0;
  const seven = overview?.sevenDayStreakUsers ?? 0;
  const thirty = overview?.thirtyDayStreakUsers ?? 0;
  const change = overview?.avgStreakChangeThisMonth ?? 0;

  // Ring fill proportional to avg/longest, capped at 100%.
  const ringPct = Math.min(100, Math.round((avg / Math.max(1, longest)) * 100));
  const circumference = 2 * Math.PI * 56;
  const dash = (ringPct / 100) * circumference;

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h3 className="text-sm font-bold text-neutral">Streak Overview</h3>

      <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:grid-cols-[160px_1fr]">
        <div className="relative mx-auto h-[140px] w-[140px]">
          {loading ? (
            <div className="h-full w-full animate-pulse rounded-full bg-neutral-soft" />
          ) : (
            <>
              <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                <circle cx="70" cy="70" r="56" stroke="#FCEBE6" strokeWidth="12" fill="none" />
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  stroke="#E35336"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold text-neutral">
                    {Math.round(avg)}
                  </span>
                  <Flame size={16} className="text-primary" />
                </div>
                <span className="text-[10px] font-semibold text-neutral-variant">
                  Avg. Streak (days)
                </span>
                <span
                  className={`mt-0.5 text-[10px] font-semibold ${
                    change >= 0 ? 'text-success' : 'text-error'
                  }`}
                >
                  {change >= 0 ? '↗' : '↘'} {Math.abs(change)} this month
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <StreakStat label="Longest Streak" value={`${formatNumber(longest)} days`} />
          <StreakStat label="7+ Day Streaks" value={`${formatNumber(seven)} users`} />
          <StreakStat label="30+ Day Streaks" value={`${formatNumber(thirty)} users`} />
        </div>
      </div>
    </div>
  );
}

function StreakStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold text-neutral-variant">{label}</span>
      <span className="flex items-center gap-1 font-display text-base font-extrabold text-neutral">
        <Flame size={14} className="text-primary" />
        {value}
      </span>
    </div>
  );
}
