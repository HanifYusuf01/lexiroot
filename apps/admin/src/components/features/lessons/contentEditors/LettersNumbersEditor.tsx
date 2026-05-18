import { useState } from 'react';
import type { LanguageCode, LessonEntryInput } from '@lexiroot/shared';
import { LettersEditor } from './LettersEditor';
import { NumbersEditor } from './NumbersEditor';

type Tab = 'letters' | 'numbers';

interface Props {
  language: LanguageCode;
  letters: LessonEntryInput<'letter'>[];
  onLettersChange: (next: LessonEntryInput<'letter'>[]) => void;
  numbers: LessonEntryInput<'number'>[];
  onNumbersChange: (next: LessonEntryInput<'number'>[]) => void;
}

export function LettersNumbersEditor({
  language,
  letters,
  onLettersChange,
  numbers,
  onNumbersChange,
}: Props) {
  const [tab, setTab] = useState<Tab>('letters');

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <TabButton
          active={tab === 'letters'}
          count={letters.length}
          label="Letters"
          onClick={() => setTab('letters')}
        />
        <TabButton
          active={tab === 'numbers'}
          count={numbers.length}
          label="Numbers"
          onClick={() => setTab('numbers')}
        />
      </div>

      {tab === 'letters' ? (
        <LettersEditor value={letters} onChange={onLettersChange} />
      ) : (
        <NumbersEditor language={language} value={numbers} onChange={onNumbersChange} />
      )}
    </div>
  );
}

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition ${
        active
          ? 'border-primary-border bg-primary-softer text-primary'
          : 'border-border bg-white text-neutral hover:bg-neutral-soft'
      }`}
    >
      {label}
      {count > 0 ? (
        <span
          className={`rounded-full px-1.5 text-[10px] font-bold ${
            active ? 'bg-primary text-primary-foreground' : 'bg-neutral-soft text-neutral-variant'
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
