import { GraduationCap, Star } from 'lucide-react';
import { BoxIcon, TotalUsersIcon } from '../../icons';
import { StatCard } from '../../ui/StatCard';
import { formatNumber } from '../../../utils/format';

interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  lessonsCompleted: number;
  xpEarned: number;
}

interface Props {
  stats?: OverviewStats;
  loading?: boolean;
}

export function OverviewStatsCards({ stats, loading }: Props) {
  const skel = loading ? '—' : null;
  const v = (n?: number) => skel ?? (n != null ? formatNumber(n) : '—');

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total User"
        value={v(stats?.totalUsers)}
        icon={<TotalUsersIcon size={28} />}
        iconBg="#E5E4FF"
        trend={{ value: '8.5%', up: true, comparison: 'Up from yesterday' }}
      />
      <StatCard
        label="Active Users"
        value={v(stats?.activeUsers)}
        icon={<BoxIcon color="#FEC53D" size={24} />}
        iconBg="#FFF4D5"
        trend={{ value: '1.3%', up: true, comparison: 'Up from past week' }}
      />
      <StatCard
        label="Lessons completed"
        value={v(stats?.lessonsCompleted)}
        icon={<GraduationCap size={24} className="text-success" />}
        iconBg="#DCFCE7"
        trend={{ value: '4.3%', up: false, comparison: 'Down from yesterday' }}
      />
      <StatCard
        label="XP Earned"
        value={v(stats?.xpEarned)}
        icon={<Star size={22} className="text-primary" fill="currentColor" />}
        iconBg="#FCEBE6"
        trend={{ value: '1.8%', up: true, comparison: 'Up from yesterday' }}
      />
    </div>
  );
}
