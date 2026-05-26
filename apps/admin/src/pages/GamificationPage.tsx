import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { SearchInput } from '../components/ui/SearchInput';
import { GamificationStatsCards } from '../components/features/gamification/GamificationStatsCards';
import { StreakOverviewCard } from '../components/features/gamification/StreakOverviewCard';
import { TopXpEarnersTable } from '../components/features/gamification/TopXpEarnersTable';
import { XpDistributionCard } from '../components/features/gamification/XpDistributionCard';
import {
  useGamificationStatsQuery,
  useTopEarnersQuery,
} from '../services/gamificationApi';
import { useState } from 'react';
import type { DateRange } from '../utils/format';

function defaultRange(): DateRange {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start, end };
}

export function GamificationPage() {
  const { data: stats, isLoading: statsLoading } = useGamificationStatsQuery();
  const { data: topEarners, isLoading: earnersLoading } = useTopEarnersQuery({
    page: 1,
    limit: 5,
  });
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<DateRange>(defaultRange);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gamification"
        subtitle="Track learner motivation and engagement through gamified activities."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} />
            <DateRangePicker value={range} onApply={setRange} />
          </>
        }
      />

      <GamificationStatsCards />

      <div className="grid gap-4 lg:grid-cols-2">
        <XpDistributionCard buckets={stats?.xpDistribution ?? []} loading={statsLoading} />
        <StreakOverviewCard overview={stats?.streakOverview} loading={statsLoading} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-neutral">Top XP Earners</h2>
          <Link
            to="/gamification/top-earners"
            className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-neutral hover:bg-neutral-soft"
          >
            View Leaderboard
          </Link>
        </div>
        <TopXpEarnersTable items={topEarners?.items ?? []} loading={earnersLoading} />
      </div>
    </div>
  );
}
