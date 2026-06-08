import { useState } from 'react';
import { PLAN_SCOPES, type PlanScope } from '@lexiroot/shared';
import { SelectMenu } from '../../ui/SelectMenu';
import { TextField } from '../../ui/TextField';
import { useSubscriptionPlansQuery } from '../../../services/subscriptionPlansApi';
import { usePlatformSettingsDraft } from '../../../hooks/usePlatformSettingsDraft';
import { PlanCard } from './PlanCard';
import { PlanEditForm } from './PlanEditForm';
import { SettingsFooter } from './SettingsFooter';

const SCOPE_OPTIONS = PLAN_SCOPES.map((value) => ({
  value,
  label: value === 'individual' ? 'Individual Plan' : 'Family Plan',
}));

export function SubscriptionBillingTab() {
  const [scope, setScope] = useState<PlanScope>('individual');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: plans = [], isLoading } = useSubscriptionPlansQuery(scope);
  const settings = usePlatformSettingsDraft();

  const editingPlan = plans.find((p) => p.id === editingId) ?? null;
  const trialPlanOptions = plans
    .filter((p) => p.premium)
    .map((p) => ({ value: p.id, label: `Premium ${p.name}` }));

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral">Subscription plans</h2>
            <p className="mt-0.5 text-xs text-neutral-variant">Manage learner pricing tiers</p>
          </div>
          <SelectMenu
            value={scope}
            options={SCOPE_OPTIONS}
            onChange={(next: PlanScope) => {
              setScope(next);
              setEditingId(null);
            }}
          />
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
                onEdit={() => setEditingId(plan.id)}
              />
            ))}
          </div>
        )}

        {/* Edit form renders inline BELOW the plan grid (never floating/overlapping). */}
        {editingPlan ? (
          <div className="mt-6">
            <PlanEditForm plan={editingPlan} onClose={() => setEditingId(null)} />
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="text-base font-bold text-neutral">Free trial</h2>
        <p className="mt-0.5 text-xs text-neutral-variant">
          Offer new learners a taste of Premium before they pay
        </p>
        <div className="mt-4 grid gap-4 sm:max-w-xl sm:grid-cols-2">
          <TextField
            label="Free trial length (Days)"
            type="number"
            min={0}
            max={90}
            value={settings.draft?.freeTrialLength ?? 7}
            onChange={(e) => settings.set('freeTrialLength', Number(e.target.value))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-neutral">Trial Plan</label>
            <SelectMenu
              value={settings.draft?.trialPlanId ?? ''}
              options={trialPlanOptions}
              onChange={(id) => settings.set('trialPlanId', id)}
              align="left"
            />
          </div>
        </div>
      </section>

      <SettingsFooter
        dirty={settings.dirty}
        saving={settings.saving}
        saved={settings.savedAt !== null}
        onCancel={settings.reset}
        onSave={settings.save}
      />
    </div>
  );
}
