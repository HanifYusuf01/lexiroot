import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PLAN_SCOPES, type PlanScope } from '@lexiroot/shared';
import { SelectMenu } from '../../ui/SelectMenu';
import { useSubscriptionPlansQuery } from '../../../services/subscriptionPlansApi';
import { PlanCard } from './PlanCard';
import { PlanCreateForm } from './PlanCreateForm';
import { PlanEditForm } from './PlanEditForm';

const SCOPE_OPTIONS = PLAN_SCOPES.map((value) => ({
  value,
  label: value === 'individual' ? 'Individual Plan' : 'Family Plan',
}));

export function SubscriptionBillingTab() {
  const [scope, setScope] = useState<PlanScope>('individual');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { data: plans = [], isLoading } = useSubscriptionPlansQuery(scope);

  const editingPlan = plans.find((p) => p.id === editingId) ?? null;

  return (
    <div className="space-y-10">
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
            <PlanEditForm plan={editingPlan} onClose={() => setEditingId(null)} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
