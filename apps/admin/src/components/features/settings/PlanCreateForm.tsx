import { FormEvent, useState } from 'react';
import { PLAN_PERIODS } from '@lexiroot/shared';
import type {
  CreateSubscriptionPlan,
  CurrencyCode,
  PlanFeatureKey,
  PlanPeriod,
  PlanScope,
} from '@lexiroot/shared';
import { Button } from '../../ui/Button';
import { SelectField } from '../../ui/SelectField';
import { TextField } from '../../ui/TextField';
import { Toggle } from '../../ui/Toggle';
import { useToast } from '../../ui/Toast';
import { PlanFeatureSelector } from './PlanFeatureSelector';
import { PlanLocalPriceFields } from './PlanLocalPriceFields';
import { useCreateSubscriptionPlanMutation } from '../../../services/subscriptionPlansApi';
import {
  draftsToInput,
  emptyCurrencyDrafts,
  type CurrencyDrafts,
} from '../../../utils/planPrices';

interface PlanCreateFormProps {
  scope: PlanScope;
  onClose: () => void;
}

export function PlanCreateForm({ scope, onClose }: PlanCreateFormProps) {
  const toast = useToast();
  const [create, { isLoading: saving }] = useCreateSubscriptionPlanMutation();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [period, setPeriod] = useState<PlanPeriod>('Month');
  const [premium, setPremium] = useState(false);
  const [features, setFeatures] = useState<PlanFeatureKey[]>([]);
  const [drafts, setDrafts] = useState<CurrencyDrafts>(emptyCurrencyDrafts);
  const [error, setError] = useState<string | undefined>();

  const setDraft = (currency: CurrencyCode, value: string) =>
    setDrafts((prev) => ({ ...prev, [currency]: { price: value } }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 1) {
      setError('Please enter a plan name');
      return;
    }
    const body: CreateSubscriptionPlan = {
      scope,
      name: name.trim(),
      price: Number(price) || 0,
      period,
      prices: draftsToInput(drafts),
      premium,
      features,
    };
    try {
      await create(body).unwrap();
      toast.success(`${body.name} plan created`);
      onClose();
    } catch {
      setError('Could not create the plan. Please try again.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-primary bg-white p-5 shadow-sm ring-4 ring-primary/10"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral">
          New {scope === 'individual' ? 'individual' : 'family'}{' '}
          <span className="text-neutral-variant">plan</span>
        </h3>
        <label className="flex items-center gap-2 text-xs font-semibold text-neutral">
          Premium
          <Toggle checked={premium} onChange={setPremium} label="Premium" />
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <TextField
          label="Plan name"
          placeholder="e.g. Monthly"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Price (USD)"
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <SelectField
          label="Per"
          value={period}
          options={PLAN_PERIODS.map((p) => ({ value: p, label: p }))}
          onChange={(e) => setPeriod(e.target.value as PlanPeriod)}
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
          Create Plan
        </Button>
      </div>
    </form>
  );
}
