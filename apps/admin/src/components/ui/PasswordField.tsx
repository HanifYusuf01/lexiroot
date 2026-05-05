import { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export function PasswordField({ label, error, className, ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const ringClass = error
    ? 'border-error focus-within:border-error focus-within:ring-error/20'
    : 'border-border focus-within:border-primary focus-within:ring-primary/20';

  return (
    <div className="flex flex-col gap-1">
      {label ? <label className="text-sm font-semibold text-neutral">{label}</label> : null}
      <div
        className={`flex h-12 items-center gap-2 rounded-xl border bg-white px-4 ring-4 ring-transparent transition ${ringClass}`}
        style={{ borderWidth: 1.5 }}
      >
        <Lock size={16} className="text-neutral-variant" aria-hidden />
        <input
          type={visible ? 'text' : 'password'}
          className={`flex-1 bg-transparent text-sm font-medium text-neutral outline-none placeholder:text-neutral-variant ${className ?? ''}`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-neutral-variant hover:text-neutral"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error ? <span className="text-xs font-medium text-error">{error}</span> : null}
    </div>
  );
}
