import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, description, disabled }: CheckboxProps) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-white'
        }`}
      >
        {checked ? <Check size={14} strokeWidth={3} /> : null}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-neutral">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-neutral-variant">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
