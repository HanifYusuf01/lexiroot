import { Bell } from 'lucide-react';

interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
}

export function NotificationBell({ count = 0, onClick }: NotificationBellProps) {
  const hasUnread = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral hover:bg-neutral-soft"
      aria-label={hasUnread ? `Notifications, ${count} unread` : 'Notifications'}
    >
      <Bell size={20} />
      {hasUnread ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </button>
  );
}
