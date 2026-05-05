import { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  iconBg: string;
  trend?: { value: string; up: boolean; comparison: string };
}

export function StatCard({ label, value, icon, iconBg, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-base font-semibold text-neutral-variant">{label}</span>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold text-neutral sm:text-3xl">
        {value}
      </div>
      {trend ? (
        <div
          className={`mt-3 flex items-center gap-1 text-xs font-semibold ${
            trend.up ? 'text-success' : 'text-error'
          }`}
        >
          {trend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{trend.value}</span>
          <span className="font-normal text-neutral-variant">{trend.comparison}</span>
        </div>
      ) : null}
    </div>
  );
}
