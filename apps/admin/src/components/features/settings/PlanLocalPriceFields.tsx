import { CURRENCIES, NON_BASE_CURRENCIES, type CurrencyCode } from '@lexiroot/shared';
import { TextField } from '../../ui/TextField';
import type { CurrencyDrafts } from '../../../utils/planPrices';

interface PlanLocalPriceFieldsProps {
  drafts: CurrencyDrafts;
  onChange: (currency: CurrencyCode, value: string) => void;
}

/**
 * Per-currency price inputs beyond the base (USD). Amounts are entered
 * deliberately, not FX-converted — leaving a currency blank means the plan isn't
 * sold in it (so that provider is skipped at sync time). Each amount is what's
 * charged once per the plan's billing period.
 */
export function PlanLocalPriceFields({ drafts, onChange }: PlanLocalPriceFieldsProps) {
  return (
    <div className="mt-5">
      <p className="text-xs font-semibold text-neutral">Local prices</p>
      <p className="mt-0.5 text-xs text-neutral-variant">
        Set a deliberate price per currency — charged as-is per period, never auto-converted. Leave
        blank to not sell in that currency.
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {NON_BASE_CURRENCIES.map((currency) => {
          const meta = CURRENCIES[currency];
          const draft = drafts[currency];
          return (
            <TextField
              key={currency}
              label={`${meta.label} price`}
              type="number"
              min={0}
              step="0.01"
              value={draft?.price ?? ''}
              placeholder={meta.symbol}
              onChange={(e) => onChange(currency, e.target.value)}
            />
          );
        })}
      </div>
    </div>
  );
}
