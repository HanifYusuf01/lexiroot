import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { SearchInput } from '../components/ui/SearchInput';
import { AnalyticsStatsCards } from '../components/features/analytics/AnalyticsStatsCards';
import { AudienceSummary } from '../components/features/analytics/AudienceSummary';
import { ConversionFunnelCard } from '../components/features/analytics/ConversionFunnelCard';
import { ProgressByLevelChart } from '../components/features/analytics/ProgressByLevelChart';
import { UserActivityChart } from '../components/features/overview/UserActivityChart';
import { TopLanguagesChart } from '../components/features/overview/TopLanguagesChart';
import { LessonOverviewCard } from '../components/features/overview/LessonOverviewCard';
import { XpDistributionCard } from '../components/features/gamification/XpDistributionCard';
import { useGetAnalyticsDashboardQuery } from '../services/analyticsApi';
import type { DateRange } from '../utils/format';

function defaultRange(): DateRange {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start, end };
}

function ymd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function AnalyticsPage() {
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<DateRange>(defaultRange);

  const { from, to } = useMemo(
    () => ({ from: ymd(range.start), to: ymd(range.end) }),
    [range],
  );
  const { data, isLoading } = useGetAnalyticsDashboardQuery({ from, to });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Track performance, engagement and learning outcomes across LexiRoot."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} />
            <DateRangePicker value={range} onApply={setRange} />
          </>
        }
      />

      <AnalyticsStatsCards kpis={data?.kpis} loading={isLoading} />

      <AudienceSummary
        activeUsers={data?.activeUsers}
        activeStreaks={data?.activeStreaks}
        loading={isLoading}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UserActivityChart data={data?.dailyActivity ?? []} />
        </div>
        <TopLanguagesChart data={data?.topLanguages ?? []} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProgressByLevelChart data={data?.progressByLevel ?? []} />
        <XpDistributionCard buckets={data?.xpDistribution ?? []} loading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ConversionFunnelCard steps={data?.funnel ?? []} />
        <LessonOverviewCard items={data?.topLessons ?? []} />
      </div>
    </div>
  );
}
