import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  loading,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-bold rounded-xl px-5 h-12 text-sm transition disabled:cursor-not-allowed';
  const variants: Record<Variant, string> = {
    primary:
      'bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-neutral-soft disabled:text-neutral-variant',
    secondary: 'bg-white text-neutral border border-border hover:bg-neutral-soft',
    ghost: 'bg-transparent text-neutral hover:bg-neutral-soft',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className ?? ''}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </button>
  );
}
