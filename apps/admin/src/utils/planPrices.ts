import {
  NON_BASE_CURRENCIES,
  type CurrencyCode,
  type PlanCurrencyPriceInput,
  type PlanPriceOverrides,
} from '@lexiroot/shared';

/** Editable string state for one non-base currency's per-period price. */
export interface CurrencyDraft {
  price: string;
}

export type CurrencyDrafts = Partial<Record<CurrencyCode, CurrencyDraft>>;

/** Blank drafts for every non-base currency. */
export function emptyCurrencyDrafts(): CurrencyDrafts {
  const drafts: CurrencyDrafts = {};
  for (const currency of NON_BASE_CURRENCIES) drafts[currency] = { price: '' };
  return drafts;
}

/** Seed drafts from a plan's stored overrides (for the edit form). */
export function draftsFromOverrides(prices?: PlanPriceOverrides): CurrencyDrafts {
  const drafts = emptyCurrencyDrafts();
  if (!prices) return drafts;
  for (const currency of NON_BASE_CURRENCIES) {
    const p = prices[currency];
    if (p) drafts[currency] = { price: String(p.price) };
  }
  return drafts;
}

/**
 * Convert drafts into the write payload, dropping currencies with a blank price
 * (a currency the plan simply isn't priced in).
 */
export function draftsToInput(drafts: CurrencyDrafts): PlanCurrencyPriceInput[] {
  const out: PlanCurrencyPriceInput[] = [];
  for (const currency of NON_BASE_CURRENCIES) {
    const d = drafts[currency];
    if (!d || d.price.trim() === '') continue;
    out.push({ currency, price: Number(d.price) || 0 });
  }
  return out;
}
