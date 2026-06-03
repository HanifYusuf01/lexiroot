import { Award, Flame, Medal, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RecentBadge } from '@lexiroot/shared';
import { formatNumber } from '../../../utils/format';

interface Props {
  badges: RecentBadge[];
  loading?: boolean;
}

const ICONS: Record<string, LucideIcon> = {
  medal: Medal,
  star: Star,
  flame: Flame,
};

export function RecentBadgesCard({ badges, loading }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h2 className="font-display text-lg font-extrabold text-neutral">Recent Badges Earned</h2>

      <div className="mt-4 flex flex-col divide-y divide-border">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-neutral-soft" />
          ))
        ) : badges.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-variant">No badges earned yet.</p>
        ) : (
          badges.map((badge) => <BadgeRow key={badge.code} badge={badge} />)
        )}
      </div>
    </div>
  );
}

function BadgeRow({ badge }: { badge: RecentBadge }) {
  const Icon = ICONS[badge.iconKey] ?? Award;
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary">
        <Icon size={20} className="text-primary-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-neutral">{badge.title}</div>
        <div className="truncate text-xs text-neutral-variant">{badge.description}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[11px] font-semibold text-neutral-variant">Earned by</div>
        <div className="font-display text-sm font-extrabold text-neutral">
          {formatNumber(badge.earnedByUsers)} users
        </div>
      </div>
    </div>
  );
}
