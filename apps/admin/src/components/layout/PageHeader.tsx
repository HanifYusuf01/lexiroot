import { ReactNode } from 'react';
import { NotificationBell } from './NotificationBell';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  notificationCount?: number;
}

export function PageHeader({ title, subtitle, actions, notificationCount = 1 }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      {/* Title row — bell sits inside on mobile so it pins to the top-right of the page. */}
      <div className="flex items-start justify-between gap-3 lg:flex-1">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold text-neutral sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-neutral-variant">{subtitle}</p>
          ) : null}
        </div>
        <div className="shrink-0 lg:hidden">
          <NotificationBell count={notificationCount} />
        </div>
      </div>
      {/* Actions row — wraps below on small screens, joins the title row on lg. */}
      <div
        className={`flex-wrap items-center gap-3 lg:flex-nowrap lg:justify-end ${
          actions ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {actions}
        <span className="hidden lg:inline-block">
          <NotificationBell count={notificationCount} />
        </span>
      </div>
    </header>
  );
}
