import { ArrowDown } from 'lucide-react';
import type { AnalyticsFunnelStep, FunnelInsight } from '@lexiroot/shared';
import { formatNumber } from '../../../../utils/format';

interface Props {
  steps: AnalyticsFunnelStep[];
  insights: FunnelInsight[];
}

const TONE_STYLES: Record<FunnelInsight['tone'], { box: string; value: string }> = {
  negative: { box: 'bg-primary-soft', value: 'text-error' },
  positive: { box: 'bg-success/10', value: 'text-success' },
  neutral: { box: 'bg-neutral-soft', value: 'text-neutral' },
};

export function RevenueConversionFunnel({ steps, insights }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-neutral">Conversion funnel</h3>
        <p className="text-xs text-neutral-variant">Free user to paid subscriber journey</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-border bg-white p-5">
          {steps.map((step, i) => (
            <div key={step.key}>
              {i > 0 ? (
                <div className="flex justify-center py-1 text-neutral-variant">
                  <ArrowDown size={14} />
                </div>
              ) : null}
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral">
                    {step.label}
                    {i > 0 && step.dropFromPrev > 0 ? (
                      <span className="ml-2 font-medium text-error">−{step.dropFromPrev}% drop</span>
                    ) : null}
                  </span>
                  <span className="text-neutral-variant">
                    {formatNumber(step.users)}{' '}
                    <span className="text-[11px]">({step.percentOfTop}%)</span>
                  </span>
                </div>
                <div className="h-7 w-full overflow-hidden rounded-md bg-neutral-soft">
                  <div
                    className="h-full rounded-md bg-primary"
                    style={{ width: `${Math.max(step.percentOfTop, 2)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold text-neutral">Funnel Insights</h4>
          {insights.map((ins) => {
            const tone = TONE_STYLES[ins.tone];
            return (
              <div key={ins.key} className={`rounded-xl p-4 ${tone.box}`}>
                <div className="text-xs font-bold text-neutral">{ins.label}</div>
                <div className="text-[11px] text-neutral-variant">{ins.detail}</div>
                <div className={`mt-1 font-display text-lg font-extrabold ${tone.value}`}>
                  {ins.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
