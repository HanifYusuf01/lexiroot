import { useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import {
  COUNTRIES,
  COUNTRY_CODES,
  COUNTRY_REGIONS,
  COUNTRY_REGION_LABELS,
  type CountryCode,
} from '@lexiroot/shared';
import { useClickOutside } from '../../hooks/useClickOutside';

interface PhoneInputProps {
  label?: string;
  country: CountryCode;
  digits: string;
  onChangeCountry: (code: CountryCode) => void;
  onChangeDigits: (digits: string) => void;
  placeholder?: string;
  error?: string;
}

export function PhoneInput({
  label,
  country,
  digits,
  onChangeCountry,
  onChangeDigits,
  placeholder = 'Phone number',
  error,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const ringClass = error
    ? 'border-error focus-within:border-error'
    : 'border-border focus-within:border-primary';

  const info = COUNTRIES[country];

  const filtered = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    return COUNTRY_REGIONS.flatMap((region) => {
      const codes = COUNTRY_CODES.filter((c) => COUNTRIES[c].region === region).filter((c) => {
        if (!trimmed) return true;
        const i = COUNTRIES[c];
        return (
          i.name.toLowerCase().includes(trimmed) ||
          i.dialCode.includes(trimmed) ||
          c.toLowerCase().includes(trimmed)
        );
      });
      return codes.length > 0
        ? [{ region, label: COUNTRY_REGION_LABELS[region], codes }]
        : [];
    });
  }, [search]);

  function pick(next: CountryCode) {
    onChangeCountry(next);
    setOpen(false);
    setSearch('');
  }

  return (
    <div className="flex flex-col gap-1">
      {label ? <label className="text-sm font-semibold text-neutral">{label}</label> : null}
      <div ref={ref} className="relative">
        <div
          className={`flex h-12 items-center rounded-xl bg-white pl-2 pr-4 transition ${ringClass}`}
          style={{ borderWidth: 1.5 }}
        >
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-neutral hover:bg-neutral-soft"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className="text-base">{info.flag}</span>
            <span>{info.dialCode}</span>
            <ChevronDown size={14} className="text-neutral-variant" />
          </button>
          <span className="mx-2 h-6 w-px bg-border" aria-hidden />
          <input
            type="tel"
            value={digits}
            onChange={(e) => onChangeDigits(e.target.value.replace(/[^\d]/g, ''))}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm font-medium text-neutral placeholder:text-neutral-variant focus:outline-none"
          />
        </div>

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
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-neutral-variant">No matches.</li>
              ) : (
                filtered.map((group) => (
                  <li key={group.region}>
                    <div className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-variant">
                      {group.label}
                    </div>
                    <ul>
                      {group.codes.map((code) => (
                        <li key={code}>
                          <button
                            type="button"
                            onClick={() => pick(code)}
                            className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-neutral-soft ${
                              code === country ? 'bg-primary-soft text-primary' : 'text-neutral'
                            }`}
                          >
                            <span className="text-base">{COUNTRIES[code].flag}</span>
                            <span className="flex-1 font-semibold">{COUNTRIES[code].name}</span>
                            <span className="text-xs text-neutral-variant">
                              {COUNTRIES[code].dialCode}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>
      {error ? <span className="text-xs font-medium text-error">{error}</span> : null}
    </div>
  );
}
