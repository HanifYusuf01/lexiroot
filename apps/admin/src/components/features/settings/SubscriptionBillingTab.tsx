import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CURRENCIES, NON_BASE_CURRENCIES, PLAN_SCOPES, type PlanScope } from '@lexiroot/shared';
import { SelectMenu } from '../../ui/SelectMenu';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/Toast';
import { usePlatformSettingsDraft } from '../../../hooks/usePlatformSettingsDraft';
import { useSubscriptionPlansQuery } from '../../../services/subscriptionPlansApi';
import { PlanCard } from './PlanCard';
import { PlanCreateForm } from './PlanCreateForm';
import { PlanEditForm } from './PlanEditForm';
import { SettingsFooter } from './SettingsFooter';

const SCOPE_OPTIONS = PLAN_SCOPES.map((value) => ({
  value,
  label: value === 'individual' ? 'Individual Plan' : 'Family Plan',
}));

export function SubscriptionBillingTab() {
  const toast = useToast();
  const [scope, setScope] = useState<PlanScope>('individual');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { data: plans = [], isLoading } = useSubscriptionPlansQuery(scope);
  const settings = usePlatformSettingsDraft();

  const editingPlan = plans.find((p) => p.id === editingId) ?? null;

  async function handleSaveSettings() {
    try {
      await settings.save();
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save settings.');
    }
  }

  function setFxRate(currency: (typeof NON_BASE_CURRENCIES)[number], value: string) {
    if (!settings.draft) return;
    const rate = Number(value);
    settings.set('fxRatesToUsd', {
      ...settings.draft.fxRatesToUsd,
      [currency]: value === '' || Number.isNaN(rate) ? undefined : rate,
    });
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-base font-bold text-neutral">Revenue reporting</h2>
        <p className="mt-0.5 text-xs text-neutral-variant">
          Exchange rates used only to blend non-USD revenue (e.g. Paystack's NGN) into USD
          analytics totals — never for pricing or billing. There's no live exchange-rate feed, so
          keep these current as rates move.
        </p>
        {settings.draft ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {NON_BASE_CURRENCIES.map((currency) => {
              const meta = CURRENCIES[currency];
              return (
                <TextField
                  key={currency}
                  label={`${meta.label} (${currency}) per USD`}
                  type="number"
                  min={0.0001}
                  step="0.01"
                  value={settings.draft!.fxRatesToUsd[currency] ?? ''}
                  placeholder={`e.g. 1500`}
                  onChange={(e) => setFxRate(currency, e.target.value)}
                />
              );
            })}
          </div>
        ) : null}
        {settings.dirty ? (
          <SettingsFooter
            dirty={settings.dirty}
            saving={settings.saving}
            onCancel={settings.reset}
            onSave={handleSaveSettings}
          />
        ) : null}
      </section>

      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral">Subscription plans</h2>
            <p className="mt-0.5 text-xs text-neutral-variant">Manage learner pricing tiers</p>
          </div>
          <div className="flex items-center gap-3">
            <SelectMenu
              value={scope}
              options={SCOPE_OPTIONS}
              onChange={(next: PlanScope) => {
                setScope(next);
                setEditingId(null);
                setAdding(false);
              }}
            />
            <button
              type="button"
              onClick={() => {
                setAdding((open) => !open);
                setEditingId(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus size={16} />
              {adding ? 'Close' : 'Add Plan'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-neutral-variant">Loading plans…</div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                editing={plan.id === editingId}
                onEdit={() => {
                  setEditingId(plan.id);
                  setAdding(false);
                }}
              />
            ))}
          </div>
        )}

        {/* Create / edit forms render inline BELOW the plan grid (never floating). */}
        {adding ? (
          <div className="mt-6">
            <PlanCreateForm scope={scope} onClose={() => setAdding(false)} />
          </div>
        ) : null}

        {editingPlan ? (
          <div className="mt-6">
            {/* `key` remounts the form when a different plan is selected. Without
                it, PlanEditForm's useState initialisers keep the first plan's
                values while the heading (read straight from props) updates. */}
            <PlanEditForm
              key={editingPlan.id}
              plan={editingPlan}
              onClose={() => setEditingId(null)}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
