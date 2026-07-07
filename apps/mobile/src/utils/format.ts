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

/** "$20" for whole amounts, "$19.99" when there are cents. */
export function formatPrice(value: number): string {
  const hasCents = !Number.isInteger(value);
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
}
