import { TrendingDown, TrendingUp } from 'lucide-react';
import type { RevenueBreakdownCard } from '@lexiroot/shared';
import { formatCompactCurrency } from '../../../../utils/format';

interface Props {
  cards: RevenueBreakdownCard[];
}

export function RevenueBreakdownCards({ cards }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-neutral">Revenue breakdown</h3>
        <p className="text-xs text-neutral-variant">Performance by subscription plan and revenue type</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.key} className="rounded-2xl border border-border bg-white p-4">
            <div className="text-xs font-semibold text-neutral-variant">{card.label}</div>
            <div className="mt-1 font-display text-xl font-extrabold text-neutral">
              {formatCompactCurrency(card.value)}
            </div>
            <div className="text-[11px] text-neutral-variant">{card.subLabel}</div>
            <div
              className={`mt-2 flex items-center gap-1 text-xs font-semibold ${
                card.up ? 'text-success' : 'text-error'
              }`}
            >
              {card.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(card.changePercent)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
