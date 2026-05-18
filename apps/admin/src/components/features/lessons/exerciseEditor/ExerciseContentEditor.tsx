import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  EXERCISE_CATEGORIES,
  EXERCISE_CATEGORY_LABELS,
  EXERCISE_CATEGORY_SUB_TYPES,
  type CorrectMeaningPayload,
  type ExerciseCategory,
  type ExerciseInput,
  type ExerciseSubType,
  type ListenSelectPayload,
  type NameFromImagePayload,
  type RecognitionPayload,
  type WordArrangePayload,
} from '@lexiroot/shared';
import { ListenSelectCard } from './ListenSelectCard';
import { CorrectMeaningCard } from './CorrectMeaningCard';
import { WordArrangeCard } from './WordArrangeCard';
import { RecognitionCard } from './RecognitionCard';
import { NameFromImageCard } from './NameFromImageCard';

interface Props {
  value: ExerciseInput[];
  onChange: (next: ExerciseInput[]) => void;
}

const CATEGORY_DESCRIPTIONS: Record<ExerciseCategory, string> = {
  'letters-numbers':
    'Build interactive exercises. Learners tap, listen and respond.',
  vocabulary:
    'Build interactive exercises. Learners listen or read the word and respond.',
  recognition: 'Build interactive exercises. Learners tap the correct image.',
  sentence:
    'Build interactive exercises. Learners arrange or tap the correct meaning.',
};

const SUB_TYPE_LABEL_BY_CATEGORY: Record<
  ExerciseCategory,
  Partial<Record<ExerciseSubType, string>>
> = {
  'letters-numbers': { 'listen-select': 'Audio to play' },
  vocabulary: {
    'listen-select': 'Audio to play',
    'correct-meaning': 'Word/Sentence',
  },
  recognition: {
    recognition: 'Word → Image',
    'name-from-image': 'Image → Word',
  },
  sentence: {
    'word-arrange': 'Word Arrange',
    'correct-meaning': 'Correct Sentence',
  },
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
    const p: WordArrangePayload = {
      sentence: '',
      instruction: '',
      correctAnswer: '',
      tiles: [],
    };
    return p;
  }
  if (subType === 'name-from-image') {
    const p: NameFromImagePayload = { imageUrl: '', instruction: '', options: [] };
    return p;
  }
  const p: RecognitionPayload = { word: '', instruction: '', options: [] };
  return p;
}

function defaultSubTypeFor(category: ExerciseCategory): ExerciseSubType {
  return EXERCISE_CATEGORY_SUB_TYPES[category][0] as ExerciseSubType;
}

export function ExerciseContentEditor({ value, onChange }: Props) {
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory>('letters-numbers');

  const indexed = useMemo(
    () => value.map((ex, originalIndex) => ({ ex, originalIndex })),
    [value],
  );
  const inActive = indexed.filter(({ ex }) => ex.category === activeCategory);

  function updateAt(originalIndex: number, next: ExerciseInput) {
    const existing = value[originalIndex];
    if (!existing) return;
    const copy = value.slice();
    copy[originalIndex] = { ...existing, ...next };
    onChange(copy);
  }

  function changeSubType(originalIndex: number, nextSubType: ExerciseSubType) {
    const existing = value[originalIndex];
    if (!existing) return;
    if (existing.subType === nextSubType) return;
    const copy = value.slice();
    copy[originalIndex] = {
      ...existing,
      subType: nextSubType,
      payload: emptyPayload(nextSubType),
    };
    onChange(copy);
  }

  function removeAt(originalIndex: number) {
    const copy = value.slice();
    copy.splice(originalIndex, 1);
    onChange(copy.map((ex, i) => ({ ...ex, orderIndex: i })));
  }

  function addCard() {
    const subType = defaultSubTypeFor(activeCategory);
    const next: ExerciseInput = {
      category: activeCategory,
      subType,
      orderIndex: value.length,
      payload: emptyPayload(subType),
    };
    onChange([...value, next]);
  }

  const allowedSubTypes = EXERCISE_CATEGORY_SUB_TYPES[activeCategory];
  const showSubTypePicker = allowedSubTypes.length > 1;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {EXERCISE_CATEGORIES.map((cat) => {
          const active = cat === activeCategory;
          const count = value.filter((ex) => ex.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition ${
                active
                  ? 'border-primary-border bg-primary-softer text-primary'
                  : 'border-border bg-white text-neutral hover:bg-neutral-soft'
              }`}
            >
              {EXERCISE_CATEGORY_LABELS[cat]}
              {count > 0 ? (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-bold ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-neutral-soft text-neutral-variant'
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
        {CATEGORY_DESCRIPTIONS[activeCategory]}
      </p>

      <div className="space-y-4">
        {inActive.map(({ ex, originalIndex }, indexInActive) => (
          <div key={originalIndex} className="rounded-lg border border-border bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              {showSubTypePicker ? (
                <select
                  value={ex.subType}
                  onChange={(e) => changeSubType(originalIndex, e.target.value as ExerciseSubType)}
                  className="h-9 rounded-md border border-border bg-white px-2 text-sm font-semibold text-neutral outline-none focus:border-primary"
                >
                  {allowedSubTypes.map((sub) => (
                    <option key={sub} value={sub}>
                      {SUB_TYPE_LABEL_BY_CATEGORY[activeCategory][sub] ?? sub}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-variant">
                  {SUB_TYPE_LABEL_BY_CATEGORY[activeCategory][ex.subType] ??
                    EXERCISE_CATEGORY_LABELS[activeCategory]}{' '}
                  #{indexInActive + 1}
                </span>
              )}
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
            ) : ex.subType === 'name-from-image' ? (
              <NameFromImageCard
                value={ex.payload as NameFromImagePayload}
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
          Add {EXERCISE_CATEGORY_LABELS[activeCategory]} exercise
        </button>
      </div>
    </div>
  );
}
