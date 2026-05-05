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
import { useAppSelector } from '../store/hooks';

// Mock data — replaced by real endpoints in a later slice.
const ACTIVITY = [
  { label: 'May 12', active: 3500, newUsers: 1300 },
  { label: 'May 13', active: 4200, newUsers: 1700 },
  { label: 'May 14', active: 4800, newUsers: 1500 },
  { label: 'May 15', active: 4100, newUsers: 1600 },
  { label: 'May 16', active: 5200, newUsers: 1450 },
  { label: 'May 17', active: 5500, newUsers: 1700 },
  { label: 'May 18', active: 6000, newUsers: 1800 },
];

const LANGUAGES = [
  { language: 'Yoruba', percent: 100, color: '#E35336' },
  { language: 'Hausa', percent: 0, color: '#F9D506' },
  { language: 'Igbo', percent: 0, color: '#1FC0E0' },
];

const LESSONS = [
  {
    id: '1',
    title: 'Greetings & Introductions',
    level: 'Beginner',
    completions: 12456,
    progress: 80,
    color: '#16A34A',
  },
  {
    id: '2',
    title: 'Greetings & Introductions',
    level: 'Beginner',
    completions: 12456,
    progress: 60,
    color: '#E35336',
  },
  {
    id: '3',
    title: 'Greetings & Introductions',
    level: 'Beginner',
    completions: 12456,
    progress: 45,
    color: '#F9D506',
  },
  {
    id: '4',
    title: 'Greetings & Introductions',
    level: 'Beginner',
    completions: 12456,
    progress: 70,
    color: '#16A34A',
  },
];

const STATS = {
  totalUsers: 24689,
  activeUsers: 10293,
  lessonsCompleted: 89000,
  xpEarned: 2040,
};

function defaultRange(): DateRange {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start, end };
}

export function OverviewPage() {
  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.displayName?.split(' ')[0] ?? '';
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<DateRange>(defaultRange);

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

      <OverviewStatsCards stats={STATS} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UserActivityChart data={ACTIVITY} />
        </div>
        <div>
          <TopLanguagesChart data={LANGUAGES} />
        </div>
        <div className="lg:col-span-2">
          <RecentUsersCard />
        </div>
        <div>
          <LessonOverviewCard items={LESSONS} />
        </div>
      </div>
    </div>
  );
}
