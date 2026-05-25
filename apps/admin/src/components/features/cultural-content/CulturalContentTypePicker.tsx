import { BookOpen, MessageSquareQuote, ScrollText } from 'lucide-react';
import {
  CULTURAL_CONTENT_TYPES,
  CULTURAL_CONTENT_TYPE_LABELS,
  type CulturalContentType,
} from '@lexiroot/shared';

interface Props {
  value: CulturalContentType;
  onChange: (next: CulturalContentType) => void;
  disabled?: boolean;
}

const ICON: Record<CulturalContentType, typeof BookOpen> = {
  story: ScrollText,
  folktale: BookOpen,
  proverb: MessageSquareQuote,
};

const ICON_BG: Record<CulturalContentType, string> = {
  story: '#E5E4FF',
  folktale: '#DCFCE7',
  proverb: '#FCEBE6',
};

const ICON_FG: Record<CulturalContentType, string> = {
  story: '#060099',
  folktale: '#16a34a',
  proverb: '#e35336',
};

const DESCRIPTIONS: Record<CulturalContentType, string> = {
  story: 'Short stories and narratives',
  folktale: 'Traditional tales and legends',
  proverb: 'Wise sayings with explanations',
};

export function CulturalContentTypePicker({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {CULTURAL_CONTENT_TYPES.map((type) => {
        const Icon = ICON[type];
        const selected = value === type;
        return (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onChange(type)}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
              selected
                ? 'border-primary-border bg-primary-softer'
                : 'border-border bg-white hover:bg-neutral-soft/60'
            }`}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: ICON_BG[type] }}
            >
              <Icon size={22} style={{ color: ICON_FG[type] }} />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-base font-extrabold text-neutral">
                {CULTURAL_CONTENT_TYPE_LABELS[type]}
              </span>
              <span className="block text-xs text-neutral-variant">{DESCRIPTIONS[type]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
