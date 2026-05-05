/** "08:30" → Date today at 08:30 (local). Falls back to today 00:00 if unparseable. */
export function parseHHMM(value: string | null | undefined): Date {
  const fallback = new Date();
  fallback.setHours(0, 0, 0, 0);
  if (!value) return fallback;
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return fallback;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return fallback;
  const d = new Date();
  d.setHours(h, min, 0, 0);
  return d;
}

/** Date → "HH:MM" 24-hour. */
export function formatHHMM(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}
