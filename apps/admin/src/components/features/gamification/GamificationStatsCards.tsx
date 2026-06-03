import { Flame, Star } from 'lucide-react';
import { StatCard } from '../../ui/StatCard';
import { XpHexagonIcon, UsersParticipatingIcon } from '../../icons';
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
        icon={<XpHexagonIcon size={28} />}
        iconBg="#DCFCE7"
        trend={{
          value: formatNumber(data?.newXpThisMonth ?? 0),
          up: true,
          comparison: 'new this month',
        }}
      />
      <StatCard
        label="Active Streaks"
        value={skel ?? formatNumber(data?.activeStreaks ?? 0)}
        icon={<Flame size={22} className="text-primary" fill="currentColor" />}
        iconBg="#FCEBE6"
        trend={{
          value: formatNumber(data?.newStreaksThisMonth ?? 0),
          up: true,
          comparison: 'this month',
        }}
      />
      <StatCard
        label="Badges Earned"
        value={skel ?? formatNumber(data?.badgesEarned ?? 0)}
        icon={<Star size={22} className="text-warning" fill="currentColor" />}
        iconBg="#FFF4D5"
        trend={{
          value: formatNumber(data?.newBadgesThisMonth ?? 0),
          up: true,
          comparison: 'this month',
        }}
      />
      <StatCard
        label="Users Participating"
        value={skel ?? formatNumber(data?.usersParticipating ?? 0)}
        icon={<UsersParticipatingIcon size={26} />}
        iconBg="#E5E4FF"
        trend={{
          value: formatNumber(data?.newParticipantsThisMonth ?? 0),
          up: true,
          comparison: 'this month',
        }}
      />
    </div>
  );
}
