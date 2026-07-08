import { useState } from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { PROVIDER_TEXT, planFeatureLabel, type SubscriptionPlan } from '@lexiroot/shared';
import { formatCurrency } from '../../../utils/format';
import { apiErrorMessage } from '../../../utils/apiError';
import { planSyncPresentation } from '../../../utils/planSync';
import { usePlanSync } from '../../../hooks/usePlanSync';
import { useDeleteSubscriptionPlanMutation } from '../../../services/subscriptionPlansApi';
import { useSyncPlanProviderMutation } from '../../../services/subscriptionsApi';
import { Badge } from '../../ui/Badge';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { useToast } from '../../ui/Toast';

interface PlanCardProps {
  plan: SubscriptionPlan;
  editing: boolean;
  onEdit: () => void;
}

export function PlanCard({ plan, editing, onEdit }: PlanCardProps) {
  const toast = useToast();
  const [syncProvider, { isLoading: syncing }] = useSyncPlanProviderMutation();
  const [deletePlan, { isLoading: deleting }] = useDeleteSubscriptionPlanMutation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const sync = usePlanSync(plan.id);
  const presentation = sync ? planSyncPresentation(sync) : null;

  const handleSync = async () => {
    const provider = sync ? PROVIDER_TEXT[sync.provider] : 'Stripe';
    try {
      await syncProvider({ planId: plan.id }).unwrap();
      toast.success(`${plan.name} synced to ${provider} — it's now purchasable`);
    } catch {
      toast.error(`Could not sync plan to ${provider}`);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlan(plan.id).unwrap();
      toast.success(`${plan.name} plan deleted`);
      setConfirmingDelete(false);
    } catch (err) {
      // The API returns 409 with a specific reason when learners are subscribed.
      toast.error(apiErrorMessage(err, 'Could not delete the plan.'));
      setConfirmingDelete(false);
    }
  };

  // An unsynced or drifted plan is a broken plan — give the card the same
  // attention-drawing treatment the badge gets, so it reads at a glance.
  const attentionRing =
    presentation?.urgent && !editing
      ? presentation.tone === 'error'
        ? 'border-error/50 ring-4 ring-error/10'
        : 'border-warning/60 ring-4 ring-warning/10'
      : 'border-border';

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-5 transition ${
        editing ? 'border-primary ring-4 ring-primary/15' : attentionRing
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

      {presentation ? (
        <div className="mt-3">
          <Badge tone={presentation.tone}>{presentation.label}</Badge>
          {presentation.hint ? (
            <p className="mt-1.5 text-xs text-neutral-variant">{presentation.hint}</p>
          ) : null}
        </div>
      ) : null}

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
        {presentation ? (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className={
              presentation.urgent
                ? 'rounded-lg bg-primary px-5 py-1.5 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60'
                : 'rounded-lg border border-border px-5 py-1.5 text-xs font-bold text-neutral transition hover:bg-neutral-soft disabled:opacity-60'
            }
          >
            {syncing ? 'Syncing…' : presentation.action}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          aria-label={`Delete ${plan.name} plan`}
          title={`Delete ${plan.name} plan`}
          className="ml-auto rounded-lg border border-border p-1.5 text-neutral-variant transition hover:border-error/40 hover:bg-error/10 hover:text-error"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        destructive
        loading={deleting}
        title={`Delete the ${plan.name} plan?`}
        confirmLabel="Delete plan"
        message={
          <>
            This permanently removes the <strong>{plan.name}</strong> plan and its provider price.
            If any learner is currently subscribed to it, the delete will be refused.
          </>
        }
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
