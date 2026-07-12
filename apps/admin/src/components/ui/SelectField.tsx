import { SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

/**
 * A labeled `<select>` styled to match `TextField`, for small fixed choice sets
 * inside a form grid (e.g. a plan's billing period).
 */
export function SelectField({ label, options, className, ...selectProps }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      {label ? <label className="text-sm font-semibold text-neutral">{label}</label> : null}
      <select
        className={`h-12 rounded-xl border-1.5 border-border bg-white px-4 text-sm font-medium text-neutral outline-none ring-4 ring-transparent transition focus:border-primary focus:ring-primary/20 ${className ?? ''}`}
        style={{ borderWidth: 1.5 }}
        {...selectProps}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
