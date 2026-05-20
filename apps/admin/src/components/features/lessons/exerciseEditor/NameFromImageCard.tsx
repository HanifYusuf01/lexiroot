import type { NameFromImagePayload } from '@lexiroot/shared';
import { YorubaInput } from '../../../ui/YorubaInput';
import { MediaUploader } from './MediaUploader';
import { OptionList } from './OptionList';

interface Props {
  value: NameFromImagePayload;
  onChange: (next: NameFromImagePayload) => void;
}

export function NameFromImageCard({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral">
            Image <span className="text-primary">*</span>
          </label>
          <MediaUploader
            kind="image"
            value={value.imageUrl || null}
            onChange={(url) => onChange({ ...value, imageUrl: url ?? '' })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral">
            Question Instruction
          </label>
          <YorubaInput
            value={value.instruction}
            onChange={(next) => onChange({ ...value, instruction: next })}
            placeholder="What is the name of the object in the picture?"
            inputClassName="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-neutral outline-none focus:border-primary"
          />
        </div>
      </div>
      <OptionList
        options={value.options}
        onChange={(options) => onChange({ ...value, options })}
        placeholder="Abebe"
      />
    </div>
  );
}
