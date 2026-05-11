import { Plus, Trash2 } from 'lucide-react';
import type { LessonEntryInput, VocabularyEntryPayload } from '@lexiroot/shared';
import { AudioRecorder } from './AudioRecorder';

interface Props {
  value: LessonEntryInput<'vocabulary'>[];
  onChange: (next: LessonEntryInput<'vocabulary'>[]) => void;
}

function blankPayload(): VocabularyEntryPayload {
  return { word: '', meaning: '', audioUrl: '', exampleSentence: '' };
}

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `vocab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function VocabularyEditor({ value, onChange }: Props) {
  function add() {
    onChange([
      ...value,
      {
        kind: 'vocabulary',
        orderIndex: value.length,
        payload: blankPayload(),
      },
    ]);
  }
  function patch(index: number, next: Partial<VocabularyEntryPayload>) {
    const copy = value.slice();
    copy[index] = { ...copy[index], payload: { ...copy[index].payload, ...next } };
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
          Add the key words learners will study in this lesson
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
              <Th>Word</Th>
              <Th>Meaning (English)</Th>
              <Th className="w-32">Audio</Th>
              <Th>Example Sentence</Th>
              <Th className="w-16 text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {value.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-xs text-neutral-variant">
                  No vocabulary words yet. Click <span className="font-semibold">Add</span> to start.
                </td>
              </tr>
            ) : null}
            {value.map((row, i) => (
              <tr key={row.id ?? `new-${i}-${newId()}`} className="border-t border-border">
                <Td>
                  <CellInput
                    value={row.payload.word}
                    onChange={(v) => patch(i, { word: v })}
                    placeholder="E kaaro"
                  />
                </Td>
                <Td>
                  <CellInput
                    value={row.payload.meaning}
                    onChange={(v) => patch(i, { meaning: v })}
                    placeholder="Good morning"
                  />
                </Td>
                <Td>
                  <AudioRecorder
                    variant="inline"
                    value={row.payload.audioUrl || null}
                    onChange={(url) => patch(i, { audioUrl: url ?? '' })}
                  />
                </Td>
                <Td>
                  <CellInput
                    value={row.payload.exampleSentence}
                    onChange={(v) => patch(i, { exampleSentence: v })}
                    placeholder="E kaaro o!"
                  />
                </Td>
                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="rounded p-1.5 text-neutral-variant hover:bg-error/10 hover:text-error"
                    title="Delete row"
                  >
                    <Trash2 size={14} />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-xs font-semibold text-neutral ${className ?? ''}`}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-middle ${className ?? ''}`}>{children}</td>;
}

function CellInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-sm text-neutral outline-none placeholder:text-neutral-variant"
    />
  );
}
