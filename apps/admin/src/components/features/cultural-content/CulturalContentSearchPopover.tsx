import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';

const STORAGE_KEY = 'lexiroot.admin.cultural-content.recent-searches';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Best-effort cache of recent searches. A private-mode / quota / disabled-
    // storage failure is harmless to the search flow, so it stays silent rather
    // than interrupting the user.
  }
}

interface Props {
  value: string;
  onChange: (next: string) => void;
  onCommit?: (value: string) => void;
}

export function CulturalContentSearchPopover({ value, onChange, onCommit }: Props) {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => loadRecent());
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false), open);

  useEffect(() => {
    saveRecent(recent);
  }, [recent]);

  function commit(next: string) {
    const trimmed = next.trim();
    if (trimmed) {
      setRecent((prev) => [trimmed, ...prev.filter((r) => r !== trimmed)].slice(0, MAX_RECENT));
    }
    onCommit?.(trimmed);
  }

  function pick(term: string) {
    onChange(term);
    commit(term);
    setOpen(false);
  }

  function removeRecent(term: string) {
    setRecent((prev) => prev.filter((r) => r !== term));
  }

  function clearAll() {
    setRecent([]);
  }

  return (
    <div ref={ref} className="relative w-full sm:w-72">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-variant"
      />
      <input
        type="text"
        placeholder="Search content"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(value);
            setOpen(false);
          }
        }}
        className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-9 text-sm text-neutral outline-none placeholder:text-neutral-variant focus:border-primary"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-variant hover:text-neutral"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}

      {open && recent.length > 0 ? (
        <div className="absolute right-0 z-30 mt-2 w-full max-w-xs rounded-xl border border-border bg-white p-3 shadow-lg sm:w-72">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral">Recent Searches</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Clear all
            </button>
          </div>
          <ul className="mt-2 space-y-1">
            {recent.map((term) => (
              <li key={term} className="flex items-center justify-between rounded-md px-1 py-1">
                <button
                  type="button"
                  onClick={() => pick(term)}
                  className="flex flex-1 items-center gap-2 truncate text-left text-sm text-neutral hover:text-primary"
                >
                  <Search size={12} className="text-neutral-variant" />
                  <span className="truncate">{term}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeRecent(term)}
                  className="rounded p-1 text-neutral-variant hover:text-neutral"
                  aria-label={`Remove ${term}`}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
