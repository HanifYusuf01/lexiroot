import type { PaymentActivityItem, PaymentActivityType } from '@lexiroot/shared';
import { Avatar } from '../../../ui/Avatar';
import { formatRelative } from '../../../../utils/format';

interface Props {
  items: PaymentActivityItem[];
}

const TYPE_STYLES: Record<PaymentActivityType, string> = {
  Upgrade: 'bg-success/10 text-success',
  Renewal: 'bg-accent/10 text-accent',
  Conversion: 'bg-warning/20 text-warning-foreground',
  Trial: 'bg-neutral-soft text-neutral-variant',
  Cancellation: 'bg-primary-soft text-error',
};

export function PaymentActivityFeed({ items }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-neutral">Payment activity</h3>
          <p className="text-xs text-neutral-variant">Recent subscription &amp; payment events</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-1 text-[11px] font-semibold text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Live
        </span>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-variant">
          No payment activity yet.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <Avatar name={item.name} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">
                  <span className="font-semibold text-neutral">{item.name}</span>{' '}
                  <span className="text-neutral-variant">{item.description}</span>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TYPE_STYLES[item.type]}`}
              >
                {item.type}
              </span>
              <span className="shrink-0 text-[11px] text-neutral-variant">
                {formatRelative(item.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
