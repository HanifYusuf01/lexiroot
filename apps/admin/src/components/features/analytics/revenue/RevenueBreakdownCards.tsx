import type { RevenueBreakdownCard } from '@lexiroot/shared';
import { formatCompactCurrency } from '../../../../utils/format';

interface Props {
  cards: RevenueBreakdownCard[];
}

const CARD_ACCENTS = [
  'bg-[#C9F7DE]',
  'bg-[#E1DFFE]',
  'bg-[#FFD8C9]',
  'bg-[#C5D4FA]',
] as const;

export function RevenueBreakdownCards({ cards }: Props) {
  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-base font-extrabold text-black">Revenue breakdown</h3>
        <p className="mt-1 text-xs text-neutral-variant">
          Performance by subscription plan and revenue type
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <div key={card.key} className="rounded-lg border border-border bg-white p-4">
            <div className={`h-12 w-12 rounded-xl ${CARD_ACCENTS[index % CARD_ACCENTS.length]}`} />
            <div className="mt-3 text-[11px] font-semibold text-black">{card.label}</div>
            <div className="font-display text-lg font-extrabold leading-tight text-black">
              {formatCompactCurrency(card.value)}
            </div>
            <div className="mt-2 text-[10px] text-neutral-variant">{card.subLabel}</div>
            <div
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                card.up ? 'bg-[#D1FADF] text-[#027A48]' : 'bg-[#FEE4E2] text-[#D92D20]'
              }`}
            >
              {card.up ? '+' : ''}
              {card.changePercent}%
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
