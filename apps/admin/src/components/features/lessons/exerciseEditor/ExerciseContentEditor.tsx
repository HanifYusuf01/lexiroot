import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  EXERCISE_SUB_TYPES,
  EXERCISE_SUB_TYPE_LABELS,
  type ExerciseInput,
  type ExerciseSubType,
  type CorrectMeaningPayload,
  type ListenSelectPayload,
  type RecognitionPayload,
  type WordArrangePayload,
} from '@lexiroot/shared';
import { ListenSelectCard } from './ListenSelectCard';
import { CorrectMeaningCard } from './CorrectMeaningCard';
import { WordArrangeCard } from './WordArrangeCard';
import { RecognitionCard } from './RecognitionCard';

interface Props {
  value: ExerciseInput[];
  onChange: (next: ExerciseInput[]) => void;
}

const SUBTYPE_DESCRIPTIONS: Record<ExerciseSubType, string> = {
  'listen-select': 'Build interactive exercises. Learners tap, listen and respond.',
  'correct-meaning': 'Build interactive exercises. Learners tap the correct meaning.',
  'word-arrange': 'Build interactive exercises. Learners arrange the sentence.',
  recognition: 'Build interactive exercises. Learners pick the correct image.',
};

function emptyPayload(subType: ExerciseSubType): ExerciseInput['payload'] {
  if (subType === 'listen-select') {
    const p: ListenSelectPayload = { audioUrl: '', instruction: '', options: [] };
    return p;
  }
  if (subType === 'correct-meaning') {
    const p: CorrectMeaningPayload = { prompt: '', instruction: '', options: [] };
    return p;
  }
  if (subType === 'word-arrange') {
    const p: WordArrangePayload = { sentence: '', instruction: '', correctAnswer: '', tiles: [] };
    return p;
  }
  const p: RecognitionPayload = { word: '', instruction: '', options: [] };
  return p;
}

export function ExerciseContentEditor({ value, onChange }: Props) {
  const [activeSubType, setActiveSubType] = useState<ExerciseSubType>('listen-select');

  const indexed = useMemo(
    () => value.map((ex, originalIndex) => ({ ex, originalIndex })),
    [value],
  );
  const inActive = indexed.filter(({ ex }) => ex.subType === activeSubType);

  function updateAt(originalIndex: number, next: ExerciseInput) {
    const copy = value.slice();
    copy[originalIndex] = { ...copy[originalIndex], ...next };
    onChange(copy);
  }

  function removeAt(originalIndex: number) {
    const copy = value.slice();
    copy.splice(originalIndex, 1);
    onChange(copy.map((ex, i) => ({ ...ex, orderIndex: i })));
  }

  function addCard() {
    const next: ExerciseInput = {
      subType: activeSubType,
      orderIndex: value.length,
      payload: emptyPayload(activeSubType),
    };
    onChange([...value, next]);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {EXERCISE_SUB_TYPES.map((sub) => {
          const active = sub === activeSubType;
          const count = value.filter((ex) => ex.subType === sub).length;
          return (
            <button
              key={sub}
              type="button"
              onClick={() => setActiveSubType(sub)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition ${
                active
                  ? 'border-primary-border bg-primary-softer text-primary'
                  : 'border-border bg-white text-neutral hover:bg-neutral-soft'
              }`}
            >
              {EXERCISE_SUB_TYPE_LABELS[sub]}
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
        })}
      </div>
      <p className="mb-4 text-xs text-neutral-variant">
        {SUBTYPE_DESCRIPTIONS[activeSubType]}
      </p>

      <div className="space-y-4">
        {inActive.map(({ ex, originalIndex }, indexInActive) => (
          <div key={originalIndex} className="rounded-lg border border-border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-variant">
                {EXERCISE_SUB_TYPE_LABELS[ex.subType]} #{indexInActive + 1}
              </span>
              <button
                type="button"
                onClick={() => removeAt(originalIndex)}
                className="rounded p-1.5 text-neutral-variant hover:bg-error/10 hover:text-error"
                title="Remove exercise"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {ex.subType === 'listen-select' ? (
              <ListenSelectCard
                value={ex.payload as ListenSelectPayload}
                onChange={(payload) => updateAt(originalIndex, { ...ex, payload })}
              />
            ) : ex.subType === 'correct-meaning' ? (
              <CorrectMeaningCard
                value={ex.payload as CorrectMeaningPayload}
                onChange={(payload) => updateAt(originalIndex, { ...ex, payload })}
              />
            ) : ex.subType === 'word-arrange' ? (
              <WordArrangeCard
                value={ex.payload as WordArrangePayload}
                onChange={(payload) => updateAt(originalIndex, { ...ex, payload })}
              />
            ) : (
              <RecognitionCard
                value={ex.payload as RecognitionPayload}
                onChange={(payload) => updateAt(originalIndex, { ...ex, payload })}
              />
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addCard}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-neutral-soft/30 py-3 text-sm font-semibold text-neutral-variant transition hover:border-primary hover:bg-primary-softer hover:text-primary"
        >
          <Plus size={14} />
          Add {EXERCISE_SUB_TYPE_LABELS[activeSubType]} exercise
        </button>
      </div>
    </div>
  );
}
