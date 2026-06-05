import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { RevenueOverTimeChart } from '../components/features/analytics/revenue/RevenueOverTimeChart';
import { RevenueBreakdownCards } from '../components/features/analytics/revenue/RevenueBreakdownCards';
import { UsersBySubscriptionChart } from '../components/features/analytics/revenue/UsersBySubscriptionChart';
import { SubscriptionGrowthChart } from '../components/features/analytics/revenue/SubscriptionGrowthChart';
import { RevenueConversionFunnel } from '../components/features/analytics/revenue/RevenueConversionFunnel';
import { PaymentProvidersCards } from '../components/features/analytics/revenue/PaymentProvidersCards';
import { PaymentActivityFeed } from '../components/features/analytics/revenue/PaymentActivityFeed';
import { useGetRevenueAnalyticsQuery } from '../services/analyticsApi';
import type { DateRange } from '../utils/format';

function defaultRange(): DateRange {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 29);
  return { start, end };
}

function ymd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function RevenueAnalyticsPage() {
  const [range, setRange] = useState<DateRange>(defaultRange);
  const { from, to } = useMemo(() => ({ from: ymd(range.start), to: ymd(range.end) }), [range]);
  const { data } = useGetRevenueAnalyticsQuery({ from, to });

  return (
    <div className="space-y-5">
      <Link
        to="/analytics"
        className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-variant hover:text-neutral"
      >
        <ArrowLeft size={14} />
        Back to Analytics
      </Link>

      <PageHeader
        title="Revenue &amp; Subscriptions"
        subtitle="Track revenue, subscriptions and payment performance across LexiRoot."
        actions={<DateRangePicker value={range} onApply={setRange} />}
      />

      <RevenueOverTimeChart data={data?.revenueOverTime ?? []} />

      <RevenueBreakdownCards cards={data?.revenueBreakdown ?? []} />

      <div className="grid gap-4 lg:grid-cols-2">
        <UsersBySubscriptionChart
          data={data?.usersBySubscription ?? []}
          breakdown={data?.planBreakdown}
        />
        <SubscriptionGrowthChart data={data?.subscriptionGrowth ?? []} />
      </div>

      <RevenueConversionFunnel
        steps={data?.funnel ?? []}
        insights={data?.funnelInsights ?? []}
      />

      <PaymentProvidersCards providers={data?.paymentProviders ?? []} />

      <PaymentActivityFeed items={data?.recentPayments ?? []} />
    </div>
  );
}
