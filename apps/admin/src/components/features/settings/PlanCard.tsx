import { CheckCircle2 } from 'lucide-react';
import { planFeatureLabel, type SubscriptionPlan } from '@lexiroot/shared';
import { formatCurrency } from '../../../utils/format';
import { useSyncPlanProviderMutation } from '../../../services/subscriptionsApi';
import { useToast } from '../../ui/Toast';

interface PlanCardProps {
  plan: SubscriptionPlan;
  editing: boolean;
  onEdit: () => void;
}

export function PlanCard({ plan, editing, onEdit }: PlanCardProps) {
  const toast = useToast();
  const [syncProvider, { isLoading: syncing }] = useSyncPlanProviderMutation();

  const handleSync = async () => {
    try {
      await syncProvider({ planId: plan.id }).unwrap();
      toast.success(`${plan.name} synced to Stripe — it's now purchasable`);
    } catch {
      toast.error('Could not sync plan to Stripe');
    }
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-5 transition ${
        editing ? 'border-primary ring-4 ring-primary/15' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral">{plan.name}</h3>
        {plan.premium ? (
          <span className="inline-flex items-center rounded-full border border-primary bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
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
            <span>{planFeatureLabel(feature)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-primary px-5 py-1.5 text-xs font-bold text-primary transition hover:bg-primary-soft"
        >
          Edit
        </button>
        {plan.premium ? (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg border border-border px-5 py-1.5 text-xs font-bold text-neutral transition hover:bg-neutral-soft disabled:opacity-60"
          >
            {syncing ? 'Syncing…' : 'Sync to Stripe'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
