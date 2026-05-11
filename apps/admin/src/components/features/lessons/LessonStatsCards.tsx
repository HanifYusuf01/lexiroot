import { Archive, BookOpen, CircleCheck, FileText } from 'lucide-react';
import { useLessonStatsQuery } from '../../../services/lessonsApi';
import { StatCard } from '../../ui/StatCard';
import { formatNumber } from '../../../utils/format';

export function LessonStatsCards() {
  const { data, isLoading } = useLessonStatsQuery();
  const total = data?.total ?? 0;
  const published = data?.published ?? 0;
  const drafts = data?.drafts ?? 0;
  const archived = data?.archived ?? 0;
  const newThisMonth = data?.newThisMonth ?? 0;
  const skel = isLoading ? '—' : null;
  const publishedPct = total > 0 ? `${Math.round((published / total) * 1000) / 10}%` : '0%';
  const draftsPct = total > 0 ? `${Math.round((drafts / total) * 1000) / 10}%` : '0%';
  const archivedPct = total > 0 ? `${Math.round((archived / total) * 1000) / 10}%` : '0%';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Lessons"
        value={skel ?? formatNumber(total)}
        icon={<BookOpen size={20} className="text-[#7B61FF]" />}
        iconBg="#E5E4FF"
        trend={{ value: `${newThisMonth} new this month`, up: true, comparison: '' }}
      />
      <StatCard
        label="Published"
        value={skel ?? formatNumber(published)}
        icon={<CircleCheck size={20} className="text-[#F4B400]" />}
        iconBg="#FFF4D5"
        trend={{ value: publishedPct, up: true, comparison: 'of total' }}
      />
      <StatCard
        label="Drafts"
        value={skel ?? formatNumber(drafts)}
        icon={<FileText size={20} className="text-success" />}
        iconBg="#DCFCE7"
        trend={{ value: draftsPct, up: true, comparison: 'of total' }}
      />
      <StatCard
        label="Archived"
        value={skel ?? formatNumber(archived)}
        icon={<Archive size={20} className="text-primary" />}
        iconBg="#FCEBE6"
        trend={{ value: archivedPct, up: true, comparison: 'total' }}
      />
    </div>
  );
}
