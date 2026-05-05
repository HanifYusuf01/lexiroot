import { Link } from 'react-router-dom';
import { formatNumber } from '../../../utils/format';

export interface LessonOverviewItem {
  id: string;
  title: string;
  level: string;
  completions: number;
  /** 0–100 progress for the colored bar. */
  progress: number;
  color: string;
}

interface Props {
  items: LessonOverviewItem[];
}

export function LessonOverviewCard({ items }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral">Lesson Overview</h3>
        <Link to="/lessons" className="text-xs font-semibold text-primary hover:underline">
          View all
        </Link>
      </div>
      <ul className="mt-4 flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <div
              className="h-12 w-12 shrink-0 rounded-md bg-neutral-soft"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-neutral">{item.title}</div>
              <div className="text-[11px] text-neutral-variant">{item.level}</div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-soft">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.progress}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
            <div className="shrink-0 text-right text-[11px] text-neutral-variant">
              <div className="font-semibold text-neutral">{formatNumber(item.completions)}</div>
              <div>Completions</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
