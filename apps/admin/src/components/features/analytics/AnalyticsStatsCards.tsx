import type { ReactNode } from 'react';
import { BookOpen, Flame, Star, TrendingDown, TrendingUp, Users } from 'lucide-react';
import type { AnalyticsDashboard, AnalyticsKpi } from '@lexiroot/shared';
import { Sparkline } from './Sparkline';
import { formatNumber } from '../../../utils/format';

interface Props {
  kpis?: AnalyticsDashboard['kpis'];
  loading?: boolean;
}

interface CardConfig {
  label: string;
  kpi?: AnalyticsKpi;
  icon: ReactNode;
  iconBg: string;
  color: string;
}

function KpiCard({ label, kpi, icon, iconBg, color, loading }: CardConfig & { loading?: boolean }) {
  const up = kpi?.up ?? true;
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </span>
        <span className="text-sm font-semibold text-neutral-variant">{label}</span>
      </div>

      <div className="mt-2 font-display text-2xl font-extrabold text-neutral">
        {loading ? '—' : formatNumber(kpi?.value ?? 0)}
      </div>

      <div className="mt-1 h-9 w-full">
        {kpi && kpi.spark.length > 0 ? <Sparkline data={kpi.spark} color={color} /> : null}
      </div>

      <div
        className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${
          up ? 'text-success' : 'text-error'
        }`}
      >
        {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{Math.abs(kpi?.changePercent ?? 0)}%</span>
        <span className="font-normal text-neutral-variant">vs last week</span>
      </div>
    </div>
  );
}

export function AnalyticsStatsCards({ kpis, loading }: Props) {
  const cards: CardConfig[] = [
    {
      label: 'Active Users',
      kpi: kpis?.activeUsers,
      icon: <Users size={20} className="text-success" />,
      iconBg: '#DCFCE7',
      color: '#16A34A',
    },
    {
      label: 'Lessons Completed',
      kpi: kpis?.lessonsCompleted,
      icon: <BookOpen size={20} className="text-[#6366F1]" />,
      iconBg: '#E5E4FF',
      color: '#6366F1',
    },
    {
      label: 'XP Earned',
      kpi: kpis?.xpEarned,
      icon: <Star size={20} className="text-primary" fill="currentColor" />,
      iconBg: '#FCEBE6',
      color: '#E35336',
    },
    {
      label: 'Daily Streaks',
      kpi: kpis?.dailyStreaks,
      icon: <Flame size={20} className="text-accent" fill="currentColor" />,
      iconBg: '#DBF6FB',
      color: '#1FC0E0',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <KpiCard key={c.label} {...c} loading={loading} />
      ))}
    </div>
  );
}
