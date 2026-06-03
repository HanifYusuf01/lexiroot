import { LineChart } from 'lucide-react';
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
  const circumference = 2 * Math.PI * 64;
  const dash = (ringPct / 100) * circumference;

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h3 className="text-lg font-extrabold text-neutral">Streak Overview</h3>

      <div className="mt-6 grid grid-cols-1 items-center gap-8 sm:grid-cols-[180px_1fr]">
        <div className="relative mx-auto h-[180px] w-[180px]">
          {loading ? (
            <div className="h-full w-full animate-pulse rounded-full bg-neutral-soft" />
          ) : (
            <>
              <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
                <circle cx="80" cy="80" r="64" stroke="#FCEBE6" strokeWidth="7" fill="none" />
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  stroke="#E35336"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                />
              </svg>

              {/* Fire badge sitting on the upper-right of the ring */}
              <span
                className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary-softer text-xl shadow-sm"
                style={{ left: '85%', top: '20%' }}
              >
                🔥
              </span>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-extrabold text-neutral">
                  {Math.round(avg)}
                </span>
                <span className="text-xs font-semibold text-neutral-variant">
                  Avg. Streak (days)
                </span>
                <span className="mt-1 flex items-center gap-1 text-sm font-semibold">
                  <LineChart size={14} className="text-accent" />
                  <span className="text-accent">{change}</span>
                  <span className="text-neutral-variant">this month</span>
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col justify-center gap-6">
          <StreakStat label="Longest Streak" value={`${formatNumber(longest)} days`} withFlame />
          <StreakStat label="7+ Day Streaks" value={`${formatNumber(seven)} users`} />
          <StreakStat label="30+ Day Streaks" value={`${formatNumber(thirty)} users`} />
        </div>
      </div>
    </div>
  );
}

function StreakStat({
  label,
  value,
  withFlame = false,
}: {
  label: string;
  value: string;
  withFlame?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-neutral-variant">{label}</span>
      <span className="font-display text-xl font-extrabold text-neutral">
        {withFlame ? '🔥' : ''}
        {value}
      </span>
    </div>
  );
}
