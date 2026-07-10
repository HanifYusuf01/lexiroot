import { FormEvent, useState } from 'react';
import type {
  CurrencyCode,
  PlanFeatureKey,
  SubscriptionPlan,
  UpdateSubscriptionPlan,
} from '@lexiroot/shared';
import { PLAN_FEATURE_KEYS } from '@lexiroot/shared';
import { Button } from '../../ui/Button';
import { TextField } from '../../ui/TextField';
import { Toggle } from '../../ui/Toggle';
import { useToast } from '../../ui/Toast';
import { PlanFeatureSelector } from './PlanFeatureSelector';
import { PlanLocalPriceFields } from './PlanLocalPriceFields';
import { useUpdateSubscriptionPlanMutation } from '../../../services/subscriptionPlansApi';
import {
  draftsFromOverrides,
  draftsToInput,
  type CurrencyDrafts,
} from '../../../utils/planPrices';

interface PlanEditFormProps {
  plan: SubscriptionPlan;
  onClose: () => void;
}

export function PlanEditForm({ plan, onClose }: PlanEditFormProps) {
  const toast = useToast();
  const [update, { isLoading: saving }] = useUpdateSubscriptionPlanMutation();
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(String(plan.price));
  const [period, setPeriod] = useState(plan.period);
  const [total, setTotal] = useState(plan.total != null ? String(plan.total) : '');
  const [premium, setPremium] = useState(plan.premium);
  // Keep only known catalog keys — legacy free-text features (from before the
  // catalog) are dropped so the selector reflects valid, gateable choices.
  const [features, setFeatures] = useState<PlanFeatureKey[]>(() =>
    plan.features.filter((f): f is PlanFeatureKey =>
      (PLAN_FEATURE_KEYS as readonly string[]).includes(f),
    ),
  );
  const [drafts, setDrafts] = useState<CurrencyDrafts>(() => draftsFromOverrides(plan.prices));
  const [error, setError] = useState<string | undefined>();

  const setDraft = (currency: CurrencyCode, field: 'price' | 'total', value: string) =>
    setDrafts((prev) => ({ ...prev, [currency]: { ...prev[currency], [field]: value } }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const changes: UpdateSubscriptionPlan = {
      name: name.trim(),
      price: Number(price) || 0,
      period: period.trim() || 'Month',
      total: total.trim() === '' ? null : Number(total) || 0,
      prices: draftsToInput(drafts),
      premium,
      features,
    };
    try {
      await update({ id: plan.id, changes }).unwrap();
      toast.success(`${changes.name || plan.name} plan updated`);
      onClose();
    } catch {
      setError('Could not save the plan. Please try again.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-primary bg-white p-5 shadow-sm ring-4 ring-primary/10"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral">
          Edit {plan.name} <span className="text-neutral-variant">plan</span>
        </h3>
        <label className="flex items-center gap-2 text-xs font-semibold text-neutral">
          Premium
          <Toggle checked={premium} onChange={setPremium} label="Premium" />
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <TextField label="Plan name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label="Price (USD)"
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <TextField label="Per" value={period} onChange={(e) => setPeriod(e.target.value)} />
        <TextField
          label="Billed total, USD (optional)"
          type="number"
          min={0}
          step="0.01"
          value={total}
          placeholder="Same as price"
          onChange={(e) => setTotal(e.target.value)}
        />
      </div>

      <PlanLocalPriceFields drafts={drafts} onChange={setDraft} />

      <div className="mt-5">
        <PlanFeatureSelector selected={features} onChange={setFeatures} />
      </div>

      {error ? <p className="mt-3 text-xs font-medium text-error">{error}</p> : null}

      <div className="mt-5 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
