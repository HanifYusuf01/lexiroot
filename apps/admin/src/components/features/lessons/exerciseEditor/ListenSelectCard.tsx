import type { ListenSelectPayload } from '@lexiroot/shared';
import { YorubaInput } from '../../../ui/YorubaInput';
import { AudioRecorder } from '../contentEditors/AudioRecorder';
import { OptionList } from './OptionList';

interface Props {
  value: ListenSelectPayload;
  onChange: (next: ListenSelectPayload) => void;
}

export function ListenSelectCard({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-neutral">
          Instruction Text
        </label>
        <YorubaInput
          value={value.instruction}
          onChange={(next) => onChange({ ...value, instruction: next })}
          placeholder="Tap Play, then select the word you hear"
          inputClassName="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-neutral outline-none focus:border-primary"
        />
      </div>
      <OptionList
        options={value.options}
        onChange={(options) => onChange({ ...value, options })}
        placeholder="E kaale (Good evening)"
      />
      <AudioRecorder
        variant="card"
        value={value.audioUrl || null}
        onChange={(url) => onChange({ ...value, audioUrl: url ?? '' })}
      />
    </div>
  );
}
