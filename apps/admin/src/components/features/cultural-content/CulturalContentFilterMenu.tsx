import { useRef, useState } from 'react';
import { Check, ListFilter } from 'lucide-react';
import {
  CULTURAL_CONTENT_STATUSES,
  CULTURAL_CONTENT_STATUS_LABELS,
  LANGUAGE_CODES,
  LANGUAGE_LABELS,
  LEARNING_LEVELS,
  LEARNING_LEVEL_LABELS,
  type CulturalContentStatus,
  type LanguageCode,
  type LearningLevel,
} from '@lexiroot/shared';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface Props {
  language: LanguageCode | undefined;
  tier: LearningLevel | undefined;
  status: CulturalContentStatus | undefined;
  onLanguageChange: (next: LanguageCode | undefined) => void;
  onTierChange: (next: LearningLevel | undefined) => void;
  onStatusChange: (next: CulturalContentStatus | undefined) => void;
}

export function CulturalContentFilterMenu({
  language,
  tier,
  status,
  onLanguageChange,
  onTierChange,
  onStatusChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const activeCount = (language ? 1 : 0) + (tier ? 1 : 0) + (status ? 1 : 0);

  function pickLanguage(code: LanguageCode) {
    onLanguageChange(language === code ? undefined : code);
  }

  function pickTier(value: LearningLevel) {
    onTierChange(tier === value ? undefined : value);
  }

  function pickStatus(value: CulturalContentStatus) {
    onStatusChange(status === value ? undefined : value);
  }

  function clearAll() {
    onLanguageChange(undefined);
    onTierChange(undefined);
    onStatusChange(undefined);
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
        {activeCount > 0 ? (
          <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-60 rounded-xl border border-border bg-white p-3 shadow-lg">
          <div>
            <div className="px-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-neutral-variant">
              Language
            </div>
            {LANGUAGE_CODES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => pickLanguage(code)}
                className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm text-neutral hover:bg-neutral-soft"
              >
                <span className={language === code ? 'font-bold text-primary' : ''}>
                  {LANGUAGE_LABELS[code]}
                </span>
                {language === code ? <Check size={14} className="text-primary" /> : null}
              </button>
            ))}
          </div>

          <div className="mt-2 border-t border-border pt-2">
            <div className="px-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-neutral-variant">
              Level
            </div>
            {LEARNING_LEVELS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => pickTier(value)}
                className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm text-neutral hover:bg-neutral-soft"
              >
                <span className={tier === value ? 'font-bold text-primary' : ''}>
                  {LEARNING_LEVEL_LABELS[value]}
                </span>
                {tier === value ? <Check size={14} className="text-primary" /> : null}
              </button>
            ))}
          </div>

          <div className="mt-2 border-t border-border pt-2">
            <div className="px-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-neutral-variant">
              Status
            </div>
            {CULTURAL_CONTENT_STATUSES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => pickStatus(value)}
                className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm text-neutral hover:bg-neutral-soft"
              >
                <span className={status === value ? 'font-bold text-primary' : ''}>
                  {CULTURAL_CONTENT_STATUS_LABELS[value]}
                </span>
                {status === value ? <Check size={14} className="text-primary" /> : null}
              </button>
            ))}
          </div>

          {activeCount > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="mt-2 w-full rounded-md px-3 py-1.5 text-left text-xs font-semibold text-neutral-variant hover:text-neutral"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
