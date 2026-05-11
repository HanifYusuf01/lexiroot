import { useState } from 'react';
import type {
  LessonEntryInput,
  RecognitionPromptMeta,
} from '@lexiroot/shared';
import { LettersEditor } from './LettersEditor';
import { RecognitionItemsEditor } from './RecognitionItemsEditor';

type Tab = 'letters' | 'recognition';

interface Props {
  letters: LessonEntryInput<'letter'>[];
  onLettersChange: (next: LessonEntryInput<'letter'>[]) => void;
  recognitionItems: LessonEntryInput<'recognition-item'>[];
  onRecognitionItemsChange: (next: LessonEntryInput<'recognition-item'>[]) => void;
  recognitionPrompt: RecognitionPromptMeta;
  onRecognitionPromptChange: (next: RecognitionPromptMeta) => void;
}

export function AlphabetsRecognitionEditor({
  letters,
  onLettersChange,
  recognitionItems,
  onRecognitionItemsChange,
  recognitionPrompt,
  onRecognitionPromptChange,
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
          active={tab === 'recognition'}
          count={recognitionItems.length}
          label="Recognition"
          onClick={() => setTab('recognition')}
        />
      </div>

      {tab === 'letters' ? (
        <LettersEditor value={letters} onChange={onLettersChange} />
      ) : (
        <RecognitionItemsEditor
          prompt={recognitionPrompt}
          onPromptChange={onRecognitionPromptChange}
          items={recognitionItems}
          onItemsChange={onRecognitionItemsChange}
        />
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
