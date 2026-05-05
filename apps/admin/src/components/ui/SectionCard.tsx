import { ReactNode } from 'react';

interface SectionCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ icon, title, subtitle, children, className = '' }: SectionCardProps) {
  return (
    <section className={`rounded-2xl border border-border bg-white p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-neutral">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-neutral-variant">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
