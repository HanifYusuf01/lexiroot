import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { GamificationStatsCards } from '../components/features/gamification/GamificationStatsCards';
import { StreakOverviewCard } from '../components/features/gamification/StreakOverviewCard';
import { TopXpEarnersTable } from '../components/features/gamification/TopXpEarnersTable';
import { RecentBadgesCard } from '../components/features/gamification/RecentBadgesCard';
import { XpDistributionCard } from '../components/features/gamification/XpDistributionCard';
import {
  useGamificationStatsQuery,
  useTopEarnersQuery,
} from '../services/gamificationApi';

export function GamificationPage() {
  const { data: stats, isLoading: statsLoading } = useGamificationStatsQuery();
  const { data: topEarners, isLoading: earnersLoading } = useTopEarnersQuery({
    page: 1,
    limit: 5,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gamification"
        subtitle="Track learner motivation and engagement through gamified activities."
      />

      <GamificationStatsCards />

      <div className="grid gap-4 lg:grid-cols-2">
        <XpDistributionCard buckets={stats?.xpDistribution ?? []} loading={statsLoading} />
        <StreakOverviewCard overview={stats?.streakOverview} loading={statsLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
          <TopXpEarnersTable
            items={topEarners?.items ?? []}
            loading={earnersLoading}
            minWidth={420}
          />
        </div>

        <RecentBadgesCard badges={stats?.recentBadges ?? []} loading={statsLoading} />
      </div>
    </div>
  );
}
