import type { AnalyticsFunnelStep } from '@lexiroot/shared';
import { formatNumber } from '../../../utils/format';

interface Props {
  steps: AnalyticsFunnelStep[];
}

export function ConversionFunnelCard({ steps }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-bold text-neutral">Conversion Funnel</h3>
        <span className="text-[11px] text-neutral-variant">All users</span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {steps.map((step, i) => (
          <div key={step.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral">
                {step.label}
                {i > 0 && step.dropFromPrev > 0 ? (
                  <span className="ml-2 font-medium text-error">−{step.dropFromPrev}%</span>
                ) : null}
              </span>
              <span className="text-neutral-variant">
                {formatNumber(step.users)}{' '}
                <span className="text-[11px]">({step.percentOfTop}%)</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-soft">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(step.percentOfTop, 1.5)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
