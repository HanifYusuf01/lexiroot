import { useGetUserStatsQuery } from '../../../services/usersApi';
import { BoxIcon, TotalUsersIcon } from '../../icons';
import { StatCard } from '../../ui/StatCard';
import { formatNumber } from '../../../utils/format';

export function UserStatsCards() {
  const { data, isLoading } = useGetUserStatsQuery();

  const total = data?.total ?? 0;
  const active = data?.active ?? 0;
  const inactive = data?.inactive ?? 0;
  const skel = isLoading ? '—' : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Total Users"
        value={skel ?? formatNumber(total)}
        icon={<TotalUsersIcon />}
        iconBg="#E5E4FF"
        trend={{ value: '8.5%', up: true, comparison: 'Up from yesterday' }}
      />
      <StatCard
        label="Active Users"
        value={skel ?? formatNumber(active)}
        icon={<BoxIcon color="#FEC53D" />}
        iconBg="#FFF4D5"
        trend={{ value: '1.3%', up: true, comparison: 'Up from past week' }}
      />
      <StatCard
        label="Inactive Users"
        value={skel ?? formatNumber(inactive)}
        icon={<BoxIcon color="#E90000" />}
        iconBg="#FCDADA"
        trend={{ value: '1.3%', up: false, comparison: 'Up from past week' }}
      />
    </div>
  );
}
