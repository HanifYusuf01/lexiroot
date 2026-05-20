import { Plus, X } from 'lucide-react';
import type { WordArrangePayload, WordArrangeTile } from '@lexiroot/shared';
import { YorubaInput } from '../../../ui/YorubaInput';

interface Props {
  value: WordArrangePayload;
  onChange: (next: WordArrangePayload) => void;
}

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `tile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function WordArrangeCard({ value, onChange }: Props) {
  function addTile() {
    const next: WordArrangeTile = { id: newId(), label: '', isCorrect: false };
    onChange({ ...value, tiles: [...value.tiles, next] });
  }
  function setTileLabel(id: string, label: string) {
    onChange({
      ...value,
      tiles: value.tiles.map((t) => (t.id === id ? { ...t, label } : t)),
    });
  }
  function toggleTileCorrect(id: string) {
    onChange({
      ...value,
      tiles: value.tiles.map((t) => (t.id === id ? { ...t, isCorrect: !t.isCorrect } : t)),
    });
  }
  function removeTile(id: string) {
    onChange({ ...value, tiles: value.tiles.filter((t) => t.id !== id) });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral">
            Sentence (Yoruba) <span className="text-primary">*</span>
          </label>
          <YorubaInput
            value={value.sentence}
            onChange={(next) => onChange({ ...value, sentence: next })}
            placeholder="My name is Akande."
            inputClassName="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-neutral outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral">
            Question Instruction
          </label>
          <YorubaInput
            value={value.instruction}
            onChange={(next) => onChange({ ...value, instruction: next })}
            placeholder="Arrange the sentence"
            inputClassName="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-neutral outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-neutral">
          Correct Answer <span className="text-primary">*</span>
        </label>
        <YorubaInput
          value={value.correctAnswer}
          onChange={(next) => onChange({ ...value, correctAnswer: next })}
          placeholder="Orúkọ mi ni Akande"
          inputClassName="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-neutral outline-none focus:border-primary"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral">
            Word tiles — all tiles shown to learner.
          </span>
          <button
            type="button"
            onClick={addTile}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-white px-2.5 text-xs font-semibold text-neutral hover:bg-neutral-soft"
          >
            <Plus size={12} />
            Add word tile
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 rounded-md border border-border bg-neutral-soft/40 p-3">
          {value.tiles.map((tile) => (
            <span
              key={tile.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm ${
                tile.isCorrect
                  ? 'border-success/50 bg-success/10 text-success'
                  : 'border-border bg-white text-neutral-variant'
              }`}
            >
              <YorubaInput
                value={tile.label}
                onChange={(next) => setTileLabel(tile.id, next)}
                placeholder="word"
                hideTrigger
                className="w-20"
                inputClassName="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-neutral-variant/60"
              />
              <button
                type="button"
                onClick={() => toggleTileCorrect(tile.id)}
                title={tile.isCorrect ? 'Mark as distractor' : 'Mark as part of answer'}
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                {tile.isCorrect ? 'CORRECT' : 'DISTRACTOR'}
              </button>
              <button
                type="button"
                onClick={() => removeTile(tile.id)}
                className="rounded-full p-0.5 hover:bg-error/10 hover:text-error"
                aria-label="Remove tile"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {value.tiles.length === 0 ? (
            <span className="text-xs text-neutral-variant">
              No tiles yet. Click "Add word tile" to add one.
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-neutral-variant">
          Green tiles = correct answers. Gray tiles = distractors.
        </p>
      </div>
    </div>
  );
}
