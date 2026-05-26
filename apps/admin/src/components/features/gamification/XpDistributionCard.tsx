import { Info } from 'lucide-react';
import type { XpDistributionBucket } from '@lexiroot/shared';
import { formatNumber } from '../../../utils/format';

interface Props {
  buckets: XpDistributionBucket[];
  loading?: boolean;
}

export function XpDistributionCard({ buckets, loading }: Props) {
  const maxUsers = Math.max(1, ...buckets.map((b) => b.users));

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold text-neutral">XP Distribution</h3>
          <Info size={12} className="text-neutral-variant" />
        </div>
        <button
          type="button"
          className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-neutral-variant hover:bg-neutral-soft"
        >
          All Time ▾
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-neutral-soft" />
            ))
          : buckets.map((b) => (
              <div key={b.label} className="grid grid-cols-[120px_1fr_80px_40px] items-center gap-2">
                <span className="text-xs font-semibold text-neutral">{b.label}</span>
                <div className="h-1.5 rounded-full bg-neutral-soft">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(4, (b.users / maxUsers) * 100)}%` }}
                  />
                </div>
                <span className="text-right text-xs font-semibold text-neutral">
                  {formatNumber(b.users)} users
                </span>
                <span className="text-right text-xs font-semibold text-neutral-variant">
                  {b.percent}%
                </span>
              </div>
            ))}
      </div>
    </div>
  );
}
