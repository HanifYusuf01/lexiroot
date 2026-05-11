import type { CorrectMeaningPayload } from '@lexiroot/shared';
import { OptionList } from './OptionList';

interface Props {
  value: CorrectMeaningPayload;
  onChange: (next: CorrectMeaningPayload) => void;
}

export function CorrectMeaningCard({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral">
            Word/sentence <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={value.prompt}
            onChange={(e) => onChange({ ...value, prompt: e.target.value })}
            placeholder="E Kaaro"
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
            placeholder="What does this greeting mean?"
            className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-neutral outline-none focus:border-primary"
          />
        </div>
      </div>
      <OptionList
        options={value.options}
        onChange={(options) => onChange({ ...value, options })}
        placeholder="Good morning"
      />
    </div>
  );
}
