import { Flame, GraduationCap, Star } from 'lucide-react';
import type { AnalyticsDashboard } from '@lexiroot/shared';
import { StatCard } from '../../ui/StatCard';
import { UsersParticipatingIcon } from '../../icons';
import { formatNumber } from '../../../utils/format';

interface Props {
  kpis?: AnalyticsDashboard['kpis'];
  loading?: boolean;
}

function trend(kpi?: { changePercent: number; up: boolean }) {
  if (!kpi) return undefined;
  return {
    value: `${Math.abs(kpi.changePercent)}%`,
    up: kpi.up,
    comparison: 'vs last period',
  };
}

export function AnalyticsStatsCards({ kpis, loading }: Props) {
  const skel = loading ? '—' : null;
  const v = (n?: number) => skel ?? formatNumber(n ?? 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Active Users"
        value={v(kpis?.activeUsers.value)}
        icon={<UsersParticipatingIcon size={26} />}
        iconBg="#E5E4FF"
        trend={trend(kpis?.activeUsers)}
      />
      <StatCard
        label="Lessons completed"
        value={v(kpis?.lessonsCompleted.value)}
        icon={<GraduationCap size={24} className="text-success" />}
        iconBg="#DCFCE7"
        trend={trend(kpis?.lessonsCompleted)}
      />
      <StatCard
        label="XP Earned"
        value={v(kpis?.xpEarned.value)}
        icon={<Star size={22} className="text-primary" fill="currentColor" />}
        iconBg="#FCEBE6"
        trend={trend(kpis?.xpEarned)}
      />
      <StatCard
        label="Daily Streaks"
        value={v(kpis?.dailyStreaks.value)}
        icon={<Flame size={22} className="text-warning-foreground" fill="#F9D506" />}
        iconBg="#FFF4D5"
        trend={trend(kpis?.dailyStreaks)}
      />
    </div>
  );
}
