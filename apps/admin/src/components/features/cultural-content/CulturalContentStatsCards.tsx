import { BookOpen, FileImage, MessageSquareQuote, NotebookText, ScrollText } from 'lucide-react';
import { useCulturalContentStatsQuery } from '../../../services/culturalContentApi';
import { StatCard } from '../../ui/StatCard';
import { formatNumber } from '../../../utils/format';

interface Props {
  newLabel?: (n: number) => string;
}

export function CulturalContentStatsCards(_: Props = {}) {
  const { data, isLoading } = useCulturalContentStatsQuery();
  const skel = isLoading ? '—' : null;

  const total = data?.total ?? 0;
  const folktales = data?.folktales ?? 0;
  const proverbs = data?.proverbs ?? 0;
  const stories = data?.stories ?? 0;
  const mediaFiles = data?.mediaFiles ?? 0;

  const newThisMonth = data?.newThisMonth ?? 0;
  const newFolktales = data?.newFolktalesThisMonth ?? 0;
  const newProverbs = data?.newProverbsThisMonth ?? 0;
  const newStories = data?.newStoriesThisMonth ?? 0;
  const newMedia = data?.newMediaFilesThisMonth ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="Total Content"
        value={skel ?? formatNumber(total)}
        icon={<NotebookText size={20} className="text-warning-foreground" />}
        iconBg="#FFF4D5"
        trend={{ value: `${newThisMonth} new this month`, up: true, comparison: '' }}
      />
      <StatCard
        label="Folktales"
        value={skel ?? formatNumber(folktales)}
        icon={<BookOpen size={20} className="text-[#7B61FF]" />}
        iconBg="#E5E4FF"
        trend={{ value: `${newFolktales} this month`, up: true, comparison: '' }}
      />
      <StatCard
        label="Proverbs"
        value={skel ?? formatNumber(proverbs)}
        icon={<MessageSquareQuote size={20} className="text-warning-foreground" />}
        iconBg="#FFF4D5"
        trend={{ value: `${newProverbs} this month`, up: true, comparison: '' }}
      />
      <StatCard
        label="Stories"
        value={skel ?? formatNumber(stories)}
        icon={<ScrollText size={20} className="text-success" />}
        iconBg="#DCFCE7"
        trend={{ value: `${newStories} this month`, up: true, comparison: '' }}
      />
      <StatCard
        label="Media files"
        value={skel ?? formatNumber(mediaFiles)}
        icon={<FileImage size={20} className="text-primary" />}
        iconBg="#FCEBE6"
        trend={{ value: `${newMedia} this month`, up: true, comparison: '' }}
      />
    </div>
  );
}
