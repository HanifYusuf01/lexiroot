import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { AnalyticsStatsCards } from '../components/features/analytics/AnalyticsStatsCards';
import { LessonsByCategoryCard } from '../components/features/analytics/LessonsByCategoryCard';
import { ProgressByLevelChart } from '../components/features/analytics/ProgressByLevelChart';
import { TopLessonsTable } from '../components/features/analytics/TopLessonsTable';
import { RevenueOverviewCard } from '../components/features/analytics/RevenueOverviewCard';
import { UsersBySubscriptionCard } from '../components/features/analytics/UsersBySubscriptionCard';
import { RevenueBreakdownCard } from '../components/features/analytics/RevenueBreakdownCard';
import { UserActivityChart } from '../components/features/overview/UserActivityChart';
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
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRange>(defaultRange);

  const { from, to } = useMemo(() => ({ from: ymd(range.start), to: ymd(range.end) }), [range]);
  const { data, isLoading } = useGetAnalyticsDashboardQuery({ from, to });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        subtitle="Track performance, engagement and learning outcomes across LexiRoot."
      />

      <div className="flex justify-end">
        <DateRangePicker value={range} onApply={setRange} />
      </div>

      <AnalyticsStatsCards kpis={data?.kpis} loading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UserActivityChart data={data?.dailyActivity ?? []} />
        </div>
        <LessonsByCategoryCard data={data?.lessonsByCategory} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ProgressByLevelChart data={data?.progressByLevel ?? []} />
        <XpDistributionCard buckets={data?.xpDistribution ?? []} loading={isLoading} />
        <TopLessonsTable items={data?.topLessons ?? []} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/analytics/revenue')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate('/analytics/revenue');
          }}
          className="cursor-pointer rounded-2xl outline-none transition hover:ring-2 hover:ring-primary-border focus-visible:ring-2 focus-visible:ring-primary-border"
        >
          <RevenueOverviewCard revenue={data?.revenue} />
        </div>
        <UsersBySubscriptionCard subscription={data?.subscription} />
        <RevenueBreakdownCard plans={data?.revenue?.plans ?? []} />
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[#FDA29B] bg-[#FFFBFA] px-4 py-3 text-xs text-[#D92D20]">
        <BarChart3 size={14} className="text-[#D92D20]" />
        Analytics updates every 15 minutes. All times are shown in your local timezone.
      </div>
    </div>
  );
}
