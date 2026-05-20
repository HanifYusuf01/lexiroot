import { Plus, Trash2 } from 'lucide-react';
import type {
  LessonEntryInput,
  RecognitionItemPayload,
  RecognitionPromptMeta,
} from '@lexiroot/shared';
import { AudioRecorder } from './AudioRecorder';
import { InlineImageCell } from './InlineImageCell';
import { YorubaInput } from '../../../ui/YorubaInput';

interface Props {
  prompt: RecognitionPromptMeta;
  onPromptChange: (next: RecognitionPromptMeta) => void;
  items: LessonEntryInput<'recognition-item'>[];
  onItemsChange: (next: LessonEntryInput<'recognition-item'>[]) => void;
}

function blankPayload(): RecognitionItemPayload {
  return { word: '', meaning: '', imageUrl: '', audioUrl: '' };
}

export function RecognitionItemsEditor({
  prompt,
  onPromptChange,
  items,
  onItemsChange,
}: Props) {
  function add() {
    onItemsChange([
      ...items,
      { kind: 'recognition-item', orderIndex: items.length, payload: blankPayload() },
    ]);
  }
  function patch(index: number, next: Partial<RecognitionItemPayload>) {
    const existing = items[index];
    if (!existing) return;
    const copy = items.slice();
    copy[index] = { ...existing, payload: { ...existing.payload, ...next } };
    onItemsChange(copy);
  }
  function remove(index: number) {
    const copy = items.slice();
    copy.splice(index, 1);
    onItemsChange(copy.map((row, i) => ({ ...row, orderIndex: i })));
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-neutral">
          Instruction Text
        </label>
        <input
          type="text"
          value={prompt.instruction}
          onChange={(e) => onPromptChange({ ...prompt, instruction: e.target.value })}
          placeholder="Tap Play to hear pronunciation"
          className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-neutral outline-none focus:border-primary"
        />
      </div>
      <AudioRecorder
        variant="card"
        value={prompt.audioUrl || null}
        onChange={(url) => onPromptChange({ ...prompt, audioUrl: url ?? '' })}
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-neutral-variant">
            Add the key words and matching images learners will recognize.
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
                <th className="px-3 py-2 text-xs font-semibold text-neutral">Word (Yoruba)</th>
                <th className="px-3 py-2 text-xs font-semibold text-neutral">Meaning (English)</th>
                <th className="w-20 px-3 py-2 text-xs font-semibold text-neutral">Image</th>
                <th className="w-32 px-3 py-2 text-xs font-semibold text-neutral">Audio</th>
                <th className="w-16 px-3 py-2 text-right text-xs font-semibold text-neutral">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-neutral-variant">
                    No recognition items yet. Click{' '}
                    <span className="font-semibold">Add</span> to start.
                  </td>
                </tr>
              ) : null}
              {items.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2 align-middle">
                    <YorubaInput
                      value={row.payload.word}
                      onChange={(v) => patch(i, { word: v })}
                      placeholder="Ìwé"
                      inputClassName="h-8 w-full bg-transparent text-sm text-neutral outline-none placeholder:text-neutral-variant"
                    />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <input
                      type="text"
                      value={row.payload.meaning ?? ''}
                      onChange={(e) => patch(i, { meaning: e.target.value })}
                      placeholder="Book"
                      className="h-8 w-full bg-transparent text-sm text-neutral outline-none placeholder:text-neutral-variant"
                    />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <InlineImageCell
                      value={row.payload.imageUrl || null}
                      onChange={(url) => patch(i, { imageUrl: url ?? '' })}
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
    </div>
  );
}
