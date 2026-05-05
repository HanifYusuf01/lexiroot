import { useRef, useState } from 'react';
import { Check, ListFilter } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';
import type { UserStatusFilter } from '../../../services/usersApi';

interface Props {
  value: UserStatusFilter | undefined;
  onChange: (next: UserStatusFilter | undefined) => void;
}

const OPTIONS: { value: UserStatusFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function FilterMenu({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  function pick(next: UserStatusFilter) {
    onChange(value === next ? undefined : next);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-neutral hover:bg-neutral-soft"
      >
        <ListFilter size={14} />
        Filter
        {value ? (
          <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            1
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-border bg-white p-2 shadow-lg">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => pick(opt.value)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-neutral hover:bg-neutral-soft"
            >
              <span className={value === opt.value ? 'font-bold text-primary' : ''}>
                {opt.label}
              </span>
              {value === opt.value ? <Check size={14} className="text-primary" /> : null}
            </button>
          ))}
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
              className="mt-1 w-full rounded-md px-3 py-1.5 text-left text-xs font-semibold text-neutral-variant hover:text-neutral"
            >
              Clear filter
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
