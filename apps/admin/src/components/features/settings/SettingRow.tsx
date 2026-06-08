import { Toggle } from '../../ui/Toggle';

interface SettingRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

/** A label + description on the left, a toggle switch on the right. */
export function SettingRow({ label, description, checked, onChange, disabled }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-neutral">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-neutral-variant">{description}</p>
        ) : null}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} label={label} />
    </div>
  );
}
