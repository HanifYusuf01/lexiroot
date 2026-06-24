export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
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
