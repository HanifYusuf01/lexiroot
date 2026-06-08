import { FormEvent, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { SubscriptionPlan, UpdateSubscriptionPlan } from '@lexiroot/shared';
import { Button } from '../../ui/Button';
import { TextField } from '../../ui/TextField';
import { Toggle } from '../../ui/Toggle';
import { useUpdateSubscriptionPlanMutation } from '../../../services/subscriptionPlansApi';

interface PlanEditFormProps {
  plan: SubscriptionPlan;
  onClose: () => void;
}

export function PlanEditForm({ plan, onClose }: PlanEditFormProps) {
  const [update, { isLoading: saving }] = useUpdateSubscriptionPlanMutation();
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(String(plan.price));
  const [period, setPeriod] = useState(plan.period);
  const [total, setTotal] = useState(plan.total != null ? String(plan.total) : '');
  const [premium, setPremium] = useState(plan.premium);
  const [features, setFeatures] = useState<string[]>(plan.features);
  const [error, setError] = useState<string | undefined>();

  function setFeature(index: number, value: string) {
    setFeatures((prev) => prev.map((f, i) => (i === index ? value : f)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanedFeatures = features.map((f) => f.trim()).filter(Boolean);
    const changes: UpdateSubscriptionPlan = {
      name: name.trim(),
      price: Number(price) || 0,
      period: period.trim() || 'Month',
      total: total.trim() === '' ? null : Number(total) || 0,
      premium,
      features: cleanedFeatures,
    };
    try {
      await update({ id: plan.id, changes }).unwrap();
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
          label="Price"
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <TextField label="Per" value={period} onChange={(e) => setPeriod(e.target.value)} />
        <TextField
          label="Billed total (optional)"
          type="number"
          min={0}
          step="0.01"
          value={total}
          placeholder="Same as price"
          onChange={(e) => setTotal(e.target.value)}
        />
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-neutral">Features</p>
        <div className="mt-2 space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <TextField
                className="flex-1"
                value={feature}
                onChange={(e) => setFeature(index, e.target.value)}
              />
              <button
                type="button"
                onClick={() => setFeatures((prev) => prev.filter((_, i) => i !== index))}
                className="rounded-md p-2 text-neutral-variant transition hover:bg-neutral-soft hover:text-error"
                aria-label="Remove feature"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFeatures((prev) => [...prev, ''])}
            className="flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-neutral-variant transition hover:border-primary hover:text-primary"
          >
            <Plus size={14} /> Add feature
          </button>
        </div>
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
