import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import type { ImageOptionItem, RecognitionPayload } from '@lexiroot/shared';
import { MediaUploader } from './MediaUploader';

interface Props {
  value: RecognitionPayload;
  onChange: (next: RecognitionPayload) => void;
}

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function RecognitionCard({ value, onChange }: Props) {
  function setImage(id: string, url: string | null) {
    onChange({
      ...value,
      options: value.options.map((o) => (o.id === id ? { ...o, imageUrl: url ?? '' } : o)),
    });
  }
  function setCorrect(id: string) {
    onChange({
      ...value,
      options: value.options.map((o) => ({ ...o, isCorrect: o.id === id })),
    });
  }
  function remove(id: string) {
    onChange({ ...value, options: value.options.filter((o) => o.id !== id) });
  }
  function add() {
    const next: ImageOptionItem = { id: newId(), imageUrl: '', isCorrect: value.options.length === 0 };
    onChange({ ...value, options: [...value.options, next] });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral">
            Word (Yoruba) <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={value.word}
            onChange={(e) => onChange({ ...value, word: e.target.value })}
            placeholder="Iwe"
            className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-neutral outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral">
            Question Instruction
          </label>
          <input
            type="text"
            value={value.instruction}
            onChange={(e) => onChange({ ...value, instruction: e.target.value })}
            placeholder="Select the correct image"
            className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-neutral outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral">
            Image options — mark the correct one
          </span>
          <button
            type="button"
            onClick={add}
            disabled={value.options.length >= 6}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-white px-2.5 text-xs font-semibold text-neutral hover:bg-neutral-soft disabled:opacity-50"
          >
            <Plus size={12} />
            Add Option
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.options.map((opt) => (
            <div
              key={opt.id}
              className={`relative rounded-lg border p-2 transition ${
                opt.isCorrect ? 'border-success bg-success/5' : 'border-border bg-white'
              }`}
            >
              <MediaUploader
                kind="image"
                variant="tile"
                value={opt.imageUrl || null}
                onChange={(url) => setImage(opt.id, url)}
              />
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCorrect(opt.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-variant hover:text-success"
                >
                  {opt.isCorrect ? (
                    <>
                      <CheckCircle2 size={14} className="text-success" />
                      <span className="text-success">Correct</span>
                    </>
                  ) : (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-border" />
                      <span>Mark correct</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(opt.id)}
                  className="rounded p-1 text-neutral-variant hover:bg-error/10 hover:text-error"
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {value.options.length === 0 ? (
            <div className="col-span-full rounded-md border border-dashed border-border bg-neutral-soft/40 px-3 py-6 text-center text-xs text-neutral-variant">
              No images yet. Click "Add Option" to add one.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
