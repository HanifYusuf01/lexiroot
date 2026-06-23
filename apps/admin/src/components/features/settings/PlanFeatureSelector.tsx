import { PLAN_FEATURES, type PlanFeatureKey } from '@lexiroot/shared';
import { Checkbox } from '../../ui/Checkbox';

interface PlanFeatureSelectorProps {
  /** Currently selected feature keys. */
  selected: PlanFeatureKey[];
  onChange: (next: PlanFeatureKey[]) => void;
}

/**
 * Tick-list of the features a plan can grant, sourced from the shared
 * PLAN_FEATURES catalog. Used by both the create and edit plan forms so the
 * options stay in sync with what the apps actually gate on.
 */
export function PlanFeatureSelector({ selected, onChange }: PlanFeatureSelectorProps) {
  function toggle(key: PlanFeatureKey, checked: boolean) {
    onChange(checked ? [...selected, key] : selected.filter((k) => k !== key));
  }

  return (
    <div>
      <p className="text-sm font-semibold text-neutral">Features</p>
      <p className="mt-0.5 text-xs text-neutral-variant">
        Select what this plan unlocks for subscribers.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {PLAN_FEATURES.map((feature) => (
          <Checkbox
            key={feature.key}
            label={feature.label}
            description={feature.description}
            checked={selected.includes(feature.key)}
            onChange={(checked) => toggle(feature.key, checked)}
          />
        ))}
      </div>
    </div>
  );
}
