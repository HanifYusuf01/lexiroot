import { CURRENCIES, type CurrencyCode } from '@lexiroot/shared';

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** "Jul 6, 2026" from an ISO 8601 string; empty string for nullish input. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * "$20" / "$19.99" / "₦9,000". The currency symbol comes from the shared
 * currency table rather than Intl currency formatting, so the naira glyph
 * renders consistently under Hermes (whose ICU currency data is limited).
 */
export function formatPrice(value: number, currency: CurrencyCode = 'USD'): string {
  const meta = CURRENCIES[currency];
  const hasCents = !Number.isInteger(value);
  const amount = value.toLocaleString('en-US', {
    minimumFractionDigits: hasCents ? meta.decimals : 0,
    maximumFractionDigits: meta.decimals,
  });
  return `${meta.symbol}${amount}`;
}
