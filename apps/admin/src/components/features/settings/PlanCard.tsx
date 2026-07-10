import { useState } from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import {
  PROVIDER_TEXT,
  planFeatureLabel,
  type PlanSyncResult,
  type SubscriptionPlan,
} from '@lexiroot/shared';
import { formatCurrency } from '../../../utils/format';
import { apiErrorMessage } from '../../../utils/apiError';
import { planSyncPresentation } from '../../../utils/planSync';
import { usePlanSync } from '../../../hooks/usePlanSync';
import { useDeleteSubscriptionPlanMutation } from '../../../services/subscriptionPlansApi';
import { useSyncPlanToAllMutation } from '../../../services/subscriptionsApi';
import { Badge } from '../../ui/Badge';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { useToast } from '../../ui/Toast';

interface PlanCardProps {
  plan: SubscriptionPlan;
  editing: boolean;
  onEdit: () => void;
}

/** Turn the sync-to-all results into a single toast line. */
function summarizeSync(results: PlanSyncResult[]): { ok: boolean; message: string } {
  if (results.length === 0) return { ok: true, message: 'Nothing to sync for a free plan.' };
  const synced = results.filter((r) => r.status === 'synced').map((r) => PROVIDER_TEXT[r.provider]);
  const failed = results.filter((r) => r.status === 'failed');
  if (failed.length === 0) return { ok: true, message: `Synced to ${synced.join(', ')}.` };
  const failedText = failed
    .map((r) => `${PROVIDER_TEXT[r.provider]} failed: ${r.error ?? 'unknown error'}`)
    .join('; ');
  const syncedText = synced.length ? `Synced to ${synced.join(', ')}. ` : '';
  return { ok: false, message: `${syncedText}${failedText}` };
}

export function PlanCard({ plan, editing, onEdit }: PlanCardProps) {
  const toast = useToast();
  const [syncToAll, { isLoading: syncing }] = useSyncPlanToAllMutation();
  const [deletePlan, { isLoading: deleting }] = useDeleteSubscriptionPlanMutation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const syncs = usePlanSync(plan.id);
  const presentations = syncs.map((s) => ({ provider: s.provider, ...planSyncPresentation(s) }));
  const needsAttention = presentations.some((p) => p.urgent);
  // Worst tone drives the card highlight: a drifted (error) plan silently
  // charges the wrong amount, so it outranks a merely-unsynced (warning) one.
  const worstTone = presentations.some((p) => p.tone === 'error')
    ? 'error'
    : presentations.some((p) => p.tone === 'warning')
      ? 'warning'
      : 'success';

  const handleSync = async () => {
    try {
      const results = await syncToAll(plan.id).unwrap();
      const { ok, message } = summarizeSync(results);
      if (ok) toast.success(`${plan.name}: ${message}`);
      else toast.error(`${plan.name}: ${message}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, `Could not sync the ${plan.name} plan.`));
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
  // attention-drawing treatment the badges get, so it reads at a glance.
  const attentionRing =
    needsAttention && !editing
      ? worstTone === 'error'
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

      {presentations.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            {presentations.map((p) => (
              <Badge key={p.provider} tone={p.tone}>
                {p.label}
              </Badge>
            ))}
          </div>
          {presentations
            .filter((p) => p.hint)
            .map((p) => (
              <p key={p.provider} className="text-xs text-neutral-variant">
                {p.hint}
              </p>
            ))}
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
        {presentations.length > 0 ? (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className={
              needsAttention
                ? 'rounded-lg bg-primary px-5 py-1.5 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60'
                : 'rounded-lg border border-border px-5 py-1.5 text-xs font-bold text-neutral transition hover:bg-neutral-soft disabled:opacity-60'
            }
          >
            {syncing ? 'Syncing…' : needsAttention ? 'Sync to all providers' : 'Re-sync all'}
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
