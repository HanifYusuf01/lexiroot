import { CreditCard } from 'lucide-react';
import type { PaymentProviderStat } from '@lexiroot/shared';
import { formatCompactCurrency, formatNumber } from '../../../../utils/format';

interface Props {
  providers: PaymentProviderStat[];
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-neutral-variant">{label}</span>
      <span className="font-semibold text-neutral">{value}</span>
    </div>
  );
}

export function PaymentProvidersCards({ providers }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-neutral">Payment analytics</h3>
        <p className="text-xs text-neutral-variant">Performance by payment provider</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {providers.map((p) => (
          <div key={p.key} className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-soft">
                <CreditCard size={16} className="text-neutral-variant" />
              </span>
              <span className="text-sm font-bold text-neutral">{p.provider}</span>
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              <Stat label="Revenue" value={formatCompactCurrency(p.revenue)} />
              <Stat label="Transactions" value={formatNumber(p.transactions)} />
              <Stat label="Success rate" value={`${p.successRate}%`} />
              <Stat label="Failed Payments" value={formatNumber(p.failedPayments)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
