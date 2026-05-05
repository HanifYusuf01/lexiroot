import { useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import {
  COUNTRIES,
  COUNTRY_CODES,
  COUNTRY_REGIONS,
  COUNTRY_REGION_LABELS,
  type CountryCode,
  type CountryRegion,
} from '@lexiroot/shared';
import { useClickOutside } from '../../hooks/useClickOutside';

interface CountrySelectProps {
  label?: string;
  value: CountryCode | null;
  onChange: (next: CountryCode) => void;
  placeholder?: string;
  error?: string;
}

interface ListEntry {
  type: 'region' | 'country';
  region?: CountryRegion;
  code?: CountryCode;
}

function buildEntries(filter: string): ListEntry[] {
  const trimmed = filter.trim().toLowerCase();
  const entries: ListEntry[] = [];
  COUNTRY_REGIONS.forEach((region) => {
    const matches = COUNTRY_CODES.filter((c) => COUNTRIES[c].region === region).filter((c) => {
      if (!trimmed) return true;
      const info = COUNTRIES[c];
      return (
        info.name.toLowerCase().includes(trimmed) ||
        info.dialCode.includes(trimmed) ||
        c.toLowerCase().includes(trimmed)
      );
    });
    if (matches.length === 0) return;
    entries.push({ type: 'region', region });
    matches.forEach((code) => entries.push({ type: 'country', code }));
  });
  return entries;
}

export function CountrySelect({
  label,
  value,
  onChange,
  placeholder = 'Select country',
  error,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const entries = useMemo(() => buildEntries(search), [search]);

  function pick(code: CountryCode) {
    onChange(code);
    setSearch('');
    setOpen(false);
  }

  const selected = value ? COUNTRIES[value] : null;
  const ringClass = error
    ? 'border-error focus-within:border-error'
    : 'border-border focus-within:border-primary';

  return (
    <div className="flex flex-col gap-1">
      {label ? <label className="text-sm font-semibold text-neutral">{label}</label> : null}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex h-12 w-full items-center justify-between rounded-xl bg-white px-4 text-sm font-medium text-neutral transition ${ringClass}`}
          style={{ borderWidth: 1.5 }}
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="text-base">{selected.flag}</span>
              <span>{selected.name}</span>
              <span className="text-neutral-variant">{selected.dialCode}</span>
            </span>
          ) : (
            <span className="text-neutral-variant">{placeholder}</span>
          )}
          <ChevronDown size={16} className="text-neutral-variant" />
        </button>

        {open ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-border bg-neutral-soft/40 px-3 py-2">
              <Search size={14} className="text-neutral-variant" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code"
                className="flex-1 bg-transparent text-sm text-neutral placeholder:text-neutral-variant focus:outline-none"
                autoFocus
              />
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {entries.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-neutral-variant">No matches.</li>
              ) : (
                entries.map((entry) =>
                  entry.type === 'region' ? (
                    <li
                      key={`r-${entry.region}`}
                      className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-variant"
                    >
                      {COUNTRY_REGION_LABELS[entry.region!]}
                    </li>
                  ) : (
                    <li key={`c-${entry.code}`}>
                      <button
                        type="button"
                        onClick={() => pick(entry.code!)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-neutral-soft ${
                          entry.code === value ? 'bg-primary-soft text-primary' : 'text-neutral'
                        }`}
                      >
                        <span className="text-base">{COUNTRIES[entry.code!].flag}</span>
                        <span className="flex-1 font-semibold">
                          {COUNTRIES[entry.code!].name}
                        </span>
                        <span className="text-xs text-neutral-variant">
                          {COUNTRIES[entry.code!].dialCode}
                        </span>
                      </button>
                    </li>
                  ),
                )
              )}
            </ul>
          </div>
        ) : null}
      </div>
      {error ? <span className="text-xs font-medium text-error">{error}</span> : null}
    </div>
  );
}
