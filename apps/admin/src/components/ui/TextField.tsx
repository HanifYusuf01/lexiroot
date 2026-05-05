import { InputHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, helper, className, ...inputProps },
  ref,
) {
  const ringClass = error
    ? 'border-error focus:border-error focus:ring-error/20'
    : 'border-border focus:border-primary focus:ring-primary/20';

  return (
    <div className="flex flex-col gap-1">
      {label ? <label className="text-sm font-semibold text-neutral">{label}</label> : null}
      <input
        ref={ref}
        className={`h-12 rounded-xl border-1.5 bg-white px-4 text-sm font-medium text-neutral outline-none ring-4 ring-transparent transition placeholder:text-neutral-variant ${ringClass} ${className ?? ''}`}
        style={{ borderWidth: 1.5 }}
        {...inputProps}
      />
      {error ? (
        <div className="flex items-center gap-1 text-error">
          <AlertCircle size={14} />
          <span className="text-xs font-medium">{error}</span>
        </div>
      ) : helper ? (
        <span className="text-xs text-neutral-variant">{helper}</span>
      ) : null}
    </div>
  );
});
