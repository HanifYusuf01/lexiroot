import type { CorrectMeaningPayload } from '@lexiroot/shared';
import { YorubaInput } from '../../../ui/YorubaInput';
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
          <YorubaInput
            value={value.prompt}
            onChange={(next) => onChange({ ...value, prompt: next })}
            placeholder="E Kaaro"
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
            placeholder="What does this greeting mean?"
            inputClassName="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-neutral outline-none focus:border-primary"
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
