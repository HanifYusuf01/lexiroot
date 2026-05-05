import { useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectMenuProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (next: T) => void;
  align?: 'left' | 'right';
}

export function SelectMenu<T extends string>({
  value,
  options,
  onChange,
  align = 'right',
}: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const current = options.find((o) => o.value === value);

  function pick(next: T) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-neutral hover:bg-neutral-soft"
      >
        {current?.label ?? '—'}
        <ChevronDown size={14} className="text-neutral-variant" />
      </button>
      {open ? (
        <div
          className={`absolute z-30 mt-2 min-w-44 rounded-xl border border-border bg-white p-2 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => pick(opt.value)}
              className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm text-neutral hover:bg-neutral-soft"
            >
              <span className={opt.value === value ? 'font-bold text-primary' : ''}>
                {opt.label}
              </span>
              {opt.value === value ? <Check size={14} className="text-primary" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
