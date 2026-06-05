import type { AnalyticsTopLesson } from '@lexiroot/shared';
import { PeriodPill } from './PeriodPill';
import { formatNumber } from '../../../utils/format';

interface Props {
  items: AnalyticsTopLesson[];
}

export function TopLessonsTable({ items }: Props) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral">Top Performing Lessons</h3>
        <PeriodPill />
      </div>

      <table className="mt-4 w-full text-xs">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-variant">
            <th className="pb-2 font-semibold">Lessons</th>
            <th className="pb-2 text-right font-semibold">Completions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={2} className="py-6 text-center text-neutral-variant">
                No data yet.
              </td>
            </tr>
          ) : (
            items.map((lesson, i) => (
              <tr key={lesson.id} className="border-t border-border">
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-variant">{i + 1}</span>
                    <span className="truncate font-semibold text-neutral">{lesson.title}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right font-semibold text-neutral">
                  {formatNumber(lesson.completions)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
