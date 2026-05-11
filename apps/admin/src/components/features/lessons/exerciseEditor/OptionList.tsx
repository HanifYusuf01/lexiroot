import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import type { OptionItem } from '@lexiroot/shared';

interface Props {
  options: OptionItem[];
  onChange: (next: OptionItem[]) => void;
  addLabel?: string;
  placeholder?: string;
}

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function OptionList({ options, onChange, addLabel = 'Add Option', placeholder = 'Type option' }: Props) {
  function setLabel(id: string, label: string) {
    onChange(options.map((o) => (o.id === id ? { ...o, label } : o)));
  }
  function setCorrect(id: string) {
    onChange(options.map((o) => ({ ...o, isCorrect: o.id === id })));
  }
  function remove(id: string) {
    onChange(options.filter((o) => o.id !== id));
  }
  function add() {
    onChange([...options, { id: newId(), label: '', isCorrect: options.length === 0 }]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral">
          Answer options — mark the correct one
        </span>
        <button
          type="button"
          onClick={add}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-white px-2.5 text-xs font-semibold text-neutral hover:bg-neutral-soft"
        >
          <Plus size={12} />
          {addLabel}
        </button>
      </div>
      <ul className="space-y-2">
        {options.map((opt) => (
          <li
            key={opt.id}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 transition ${
              opt.isCorrect
                ? 'border-success/40 bg-success/5'
                : 'border-border bg-white'
            }`}
          >
            <button
              type="button"
              onClick={() => setCorrect(opt.id)}
              className="flex h-5 w-5 items-center justify-center"
              aria-label="Mark correct"
            >
              {opt.isCorrect ? (
                <CheckCircle2 size={18} className="text-success" />
              ) : (
                <span className="h-4 w-4 rounded-full border-2 border-border" />
              )}
            </button>
            <input
              type="text"
              value={opt.label}
              onChange={(e) => setLabel(opt.id, e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm text-neutral outline-none placeholder:text-neutral-variant"
            />
            {opt.isCorrect ? (
              <span className="text-xs font-semibold text-success">✓ Correct</span>
            ) : null}
            <button
              type="button"
              onClick={() => remove(opt.id)}
              className="rounded p-1 text-neutral-variant hover:bg-error/10 hover:text-error"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
        {options.length === 0 ? (
          <li className="rounded-md border border-dashed border-border bg-neutral-soft/40 px-3 py-3 text-center text-xs text-neutral-variant">
            No options yet. Click "{addLabel}" to add one.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
