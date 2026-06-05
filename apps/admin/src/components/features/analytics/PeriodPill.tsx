import { ChevronDown } from 'lucide-react';

// Static period selector matching the design. Wire to real state once
// per-card range filtering is needed.
export function PeriodPill({ label = 'All Time' }: { label?: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-neutral-variant hover:bg-neutral-soft"
    >
      {label}
      <ChevronDown size={12} />
    </button>
  );
}
