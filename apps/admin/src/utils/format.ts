const DAY_MS = 1000 * 60 * 60 * 24;

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** "10:24 AM" */
export function formatTimeOfDay(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** "Today, 9:42 AM" / "Yesterday, 9:15 PM" / "Mar 12, 2026" */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const sameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();
  if (sameDay) return `Today, ${time}`;
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 2 * DAY_MS) return `Yesterday, ${time}`;
  return formatDate(iso);
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`;
}

export interface DateRange {
  start: Date;
  end: Date;
}

/** "May 12 - May 18, 2025" / "Dec 28, 2025 - Jan 3, 2026" */
export function formatDateRange({ start, end }: DateRange): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const startFmt: Intl.DateTimeFormatOptions = sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' };
  const endFmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${start.toLocaleDateString('en-US', startFmt)} - ${end.toLocaleDateString('en-US', endFmt)}`;
}
