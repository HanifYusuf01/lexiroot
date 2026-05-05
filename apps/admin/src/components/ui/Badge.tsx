import { ReactNode } from 'react';

type Tone = 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  tone: Tone;
  children: ReactNode;
}

const toneClasses: Record<Tone, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/20 text-warning-foreground',
  error: 'bg-error/15 text-error',
  neutral: 'bg-neutral-soft text-neutral-variant',
};

export function Badge({ tone, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
