import { Plus, Trash2 } from 'lucide-react';
import type { LessonEntryInput, LetterEntryPayload } from '@lexiroot/shared';
import { AudioRecorder } from './AudioRecorder';
import { YorubaInput } from '../../../ui/YorubaInput';

interface Props {
  value: LessonEntryInput<'letter'>[];
  onChange: (next: LessonEntryInput<'letter'>[]) => void;
}

function blankPayload(): LetterEntryPayload {
  return { letter: '', audioUrl: '' };
}

export function LettersEditor({ value, onChange }: Props) {
  function add() {
    onChange([
      ...value,
      { kind: 'letter', orderIndex: value.length, payload: blankPayload() },
    ]);
  }
  function patch(index: number, next: Partial<LetterEntryPayload>) {
    const existing = value[index];
    if (!existing) return;
    const copy = value.slice();
    copy[index] = { ...existing, payload: { ...existing.payload, ...next } };
    onChange(copy);
  }
  function remove(index: number) {
    const copy = value.slice();
    copy.splice(index, 1);
    onChange(copy.map((row, i) => ({ ...row, orderIndex: i })));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-neutral-variant">
          Add the key alphabets learners will study in this lesson
        </p>
        <button
          type="button"
          onClick={add}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-white px-2.5 text-xs font-semibold text-neutral hover:bg-neutral-soft"
        >
          <Plus size={12} />
          Add
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-primary-softer/40">
            <tr className="text-left">
              <th className="px-3 py-2 text-xs font-semibold text-neutral">Letter</th>
              <th className="w-32 px-3 py-2 text-xs font-semibold text-neutral">Audio</th>
              <th className="w-16 px-3 py-2 text-right text-xs font-semibold text-neutral">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {value.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-xs text-neutral-variant">
                  No letters yet. Click <span className="font-semibold">Add</span> to start.
                </td>
              </tr>
            ) : null}
            {value.map((row, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-2 align-middle">
                  <YorubaInput
                    value={row.payload.letter}
                    onChange={(v) => patch(i, { letter: v })}
                    placeholder="á"
                    inputClassName="h-8 w-full bg-transparent text-sm text-neutral outline-none placeholder:text-neutral-variant"
                  />
                </td>
                <td className="px-3 py-2 align-middle">
                  <AudioRecorder
                    variant="inline"
                    value={row.payload.audioUrl || null}
                    onChange={(url) => patch(i, { audioUrl: url ?? '' })}
                  />
                </td>
                <td className="px-3 py-2 text-right align-middle">
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="rounded p-1.5 text-neutral-variant hover:bg-error/10 hover:text-error"
                    title="Delete row"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
