import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

function buildPageList(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const pages = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | 'gap'> = [];
  pages.forEach((p, i) => {
    const prev = i > 0 ? pages[i - 1] : undefined;
    if (prev !== undefined && p - prev > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

export function Pagination({ page, totalPages, onChange, disabled }: Props) {
  if (totalPages <= 1) return null;
  const items = buildPageList(page, totalPages);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1 || disabled}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-neutral disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
      </button>
      {items.map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-neutral-variant">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            disabled={disabled}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold transition ${
              item === page
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-neutral hover:bg-neutral-soft'
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages || disabled}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-neutral disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
