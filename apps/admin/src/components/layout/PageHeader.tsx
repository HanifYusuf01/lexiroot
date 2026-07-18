import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 lg:flex-1">
        <h1 className="font-display text-2xl font-extrabold text-neutral sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-neutral-variant">{subtitle}</p>
        ) : null}
      </div>
      {/* Actions row — wraps below on small screens, joins the title row on lg. */}
      <div
        className={`flex-wrap items-center gap-3 lg:flex-nowrap lg:justify-end ${
          actions ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {actions}
      </div>
    </header>
  );
}
