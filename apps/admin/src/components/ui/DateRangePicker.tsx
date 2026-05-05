import { useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { type DateRange, formatDateRange } from '../../utils/format';
import { Button } from './Button';

interface DateRangePickerProps {
  value: DateRange;
  onApply: (range: DateRange) => void;
  /** How many years above/below the current selection to show in the year dropdown. */
  yearSpan?: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(d: Date, start: Date, end: Date): boolean {
  const t = startOfDay(d).getTime();
  return t >= startOfDay(start).getTime() && t <= startOfDay(end).getTime();
}

/** 6×7 grid of dates covering the displayed month, padded with neighbour-month days. */
function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function DateRangePicker({ value, onApply, yearSpan = 5 }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState<Date>(value.start);
  const [draftEnd, setDraftEnd] = useState<Date>(value.end);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [viewMonth, setViewMonth] = useState(value.start.getMonth());
  const [viewYear, setViewYear] = useState(value.start.getFullYear());

  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false), open);

  function openPicker() {
    setDraftStart(value.start);
    setDraftEnd(value.end);
    setPickingEnd(false);
    setViewMonth(value.start.getMonth());
    setViewYear(value.start.getFullYear());
    setOpen(true);
  }

  function handleDayClick(d: Date) {
    const day = startOfDay(d);
    if (!pickingEnd) {
      setDraftStart(day);
      setDraftEnd(day);
      setPickingEnd(true);
    } else {
      if (day.getTime() < draftStart.getTime()) {
        setDraftEnd(draftStart);
        setDraftStart(day);
      } else {
        setDraftEnd(day);
      }
      setPickingEnd(false);
    }
  }

  function applyRange() {
    onApply({ start: draftStart, end: draftEnd });
    setOpen(false);
  }

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const years = useMemo(() => {
    const center = value.start.getFullYear();
    return Array.from({ length: yearSpan * 2 + 1 }, (_, i) => center - yearSpan + i);
  }, [value.start, yearSpan]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex h-10 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-neutral hover:bg-neutral-soft"
      >
        {formatDateRange(value)}
        <ChevronDown size={14} className="text-neutral-variant" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl border border-border bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="w-full appearance-none rounded-md py-1 pl-2 pr-6 text-sm font-semibold text-neutral hover:bg-neutral-soft focus:outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-neutral-variant"
              />
            </div>
            <div className="relative flex-1">
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="w-full appearance-none rounded-md py-1 pl-2 pr-6 text-sm font-semibold text-neutral hover:bg-neutral-soft focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-neutral-variant"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold text-neutral-variant">
            {WEEKDAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-xs">
            {grid.map((d) => {
              const inMonth = d.getMonth() === viewMonth;
              const isStart = isSameDay(d, draftStart);
              const isEnd = isSameDay(d, draftEnd);
              const inRange = isInRange(d, draftStart, draftEnd);
              const isEndpoint = isStart || isEnd;
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(d)}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full transition ${
                    isEndpoint
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : inRange
                        ? 'bg-primary-soft text-neutral'
                        : inMonth
                          ? 'text-neutral hover:bg-neutral-soft'
                          : 'text-neutral-variant/60 hover:bg-neutral-soft'
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-center text-[11px] italic text-neutral-variant">
            *You can choose multiple date
          </p>

          <Button onClick={applyRange} className="mt-3 w-full">
            Apply Now
          </Button>
        </div>
      ) : null}
    </div>
  );
}
