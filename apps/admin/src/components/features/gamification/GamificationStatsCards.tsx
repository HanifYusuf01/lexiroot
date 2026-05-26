import { Award, Flame, Star, Users } from 'lucide-react';
import { StatCard } from '../../ui/StatCard';
import { formatNumber } from '../../../utils/format';
import { useGamificationStatsQuery } from '../../../services/gamificationApi';

export function GamificationStatsCards() {
  const { data, isLoading } = useGamificationStatsQuery();
  const skel = isLoading ? '—' : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total XP earned"
        value={skel ?? formatNumber(data?.totalXpEarned ?? 0)}
        icon={<Star size={20} className="text-success" fill="currentColor" />}
        iconBg="#DCFCE7"
        trend={{
          value: `${formatNumber(data?.newXpThisMonth ?? 0)} new this month`,
          up: true,
          comparison: '',
        }}
      />
      <StatCard
        label="Active Streaks"
        value={skel ?? formatNumber(data?.activeStreaks ?? 0)}
        icon={<Flame size={20} className="text-primary" />}
        iconBg="#FCEBE6"
        trend={{
          value: `${formatNumber(data?.newStreaksThisMonth ?? 0)} this month`,
          up: true,
          comparison: '',
        }}
      />
      <StatCard
        label="Badges Earned"
        value={skel ?? formatNumber(data?.badgesEarned ?? 0)}
        icon={<Award size={20} className="text-warning-foreground" />}
        iconBg="#FFF4D5"
        trend={{
          value: `${formatNumber(data?.newBadgesThisMonth ?? 0)} this month`,
          up: true,
          comparison: '',
        }}
      />
      <StatCard
        label="Users Participating"
        value={skel ?? formatNumber(data?.usersParticipating ?? 0)}
        icon={<Users size={20} className="text-[#7B61FF]" />}
        iconBg="#E5E4FF"
        trend={{
          value: `${formatNumber(data?.newParticipantsThisMonth ?? 0)} this month`,
          up: true,
          comparison: '',
        }}
      />
    </div>
  );
}
