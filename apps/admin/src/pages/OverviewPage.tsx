import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { SearchInput } from '../components/ui/SearchInput';
import type { DateRange } from '../utils/format';
import { LessonOverviewCard } from '../components/features/overview/LessonOverviewCard';
import { OverviewStatsCards } from '../components/features/overview/OverviewStatsCards';
import { RecentUsersCard } from '../components/features/overview/RecentUsersCard';
import { TopLanguagesChart } from '../components/features/overview/TopLanguagesChart';
import { UserActivityChart } from '../components/features/overview/UserActivityChart';
import { useGetAnalyticsOverviewQuery } from '../services/analyticsApi';
import { useAppSelector } from '../store/hooks';

function defaultRange(): DateRange {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start, end };
}

export function OverviewPage() {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';
  const firstName = user?.displayName?.split(' ')[0] ?? '';
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<DateRange>(defaultRange);
  const { data: overview, isLoading } = useGetAnalyticsOverviewQuery();

  const stats = {
    totalUsers: overview?.totalUsers,
    activeUsers: overview?.activeUsers,
    lessonsCompleted: overview?.lessonsCompleted ?? 0,
    xpEarned: overview?.xpEarned ?? 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle={`Welcome back${firstName ? ` ${firstName}` : ''}, here's what's happening with LexiRoot`}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} />
            <DateRangePicker value={range} onApply={setRange} />
          </>
        }
      />

      <OverviewStatsCards stats={stats} loading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UserActivityChart data={overview?.dailyActivity ?? []} />
        </div>
        <div>
          <TopLanguagesChart data={overview?.topLanguages ?? []} />
        </div>
        {isAdmin ? (
          <div className="lg:col-span-2">
            <RecentUsersCard />
          </div>
        ) : null}
        <div>
          <LessonOverviewCard items={overview?.topLessons ?? []} />
        </div>
      </div>
    </div>
  );
}
