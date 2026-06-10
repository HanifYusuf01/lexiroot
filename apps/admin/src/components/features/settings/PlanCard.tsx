import { CheckCircle2 } from 'lucide-react';
import type { SubscriptionPlan } from '@lexiroot/shared';
import { formatCurrency } from '../../../utils/format';

interface PlanCardProps {
  plan: SubscriptionPlan;
  editing: boolean;
  onEdit: () => void;
}

export function PlanCard({ plan, editing, onEdit }: PlanCardProps) {
  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-5 transition ${
        editing ? 'border-primary ring-4 ring-primary/15' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral">{plan.name}</h3>
        {plan.premium ? (
          <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            Premium
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-extrabold text-neutral">
          {formatCurrency(plan.price)}
          <span className="text-sm font-semibold text-neutral-variant"> /{plan.period}</span>
        </p>
        {plan.total != null ? (
          <p className="text-sm font-bold text-neutral-variant">{formatCurrency(plan.total)}</p>
        ) : null}
      </div>

      <ul className="mt-4 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-neutral">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onEdit}
        className="mt-5 self-start rounded-lg border border-primary px-5 py-1.5 text-xs font-bold text-primary transition hover:bg-primary-soft"
      >
        Edit
      </button>
    </div>
  );
}
