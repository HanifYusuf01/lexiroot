import {
  LANGUAGE_LABELS,
  LEARNING_LEVEL_LABELS,
  LESSON_STATUS_LABELS,
  LESSON_TYPE_LABELS,
  type DurationBucket,
  type LanguageCode,
  type LearningLevel,
  type LessonStatus,
  type LessonType,
} from '@lexiroot/shared';

interface Props {
  language: LanguageCode;
  level: LearningLevel;
  categoryName: string | null;
  type: LessonType;
  speechRequired: boolean;
  estimatedDuration: DurationBucket | null;
  xpReward: number;
  status: LessonStatus;
}

export function LessonSummaryCard({
  language,
  level,
  categoryName,
  type,
  speechRequired,
  estimatedDuration,
  xpReward,
  status,
}: Props) {
  return (
    <aside className="rounded-2xl border-1 border-primary-border bg-[#FEFBFB] p-6 lg:sticky lg:top-6 h-[420px]">
      <h3 className="mb-6 font-display text-lg font-extrabold text-neutral">Lesson Summary</h3>
      <dl className="space-y-5 text-sm">
        <Row label="Language" value={LANGUAGE_LABELS[language]} />
        <Row label="Level" value={LEARNING_LEVEL_LABELS[level]} />
        <Row label="Category" value={categoryName ?? '—'} />
        <Row label="Lesson Type" value={LESSON_TYPE_LABELS[type]} />
        <Row label="Speech Required" value={speechRequired ? 'Yes' : 'No'} />
        <Row label="Estimated Duration" value={estimatedDuration ?? '—'} />
        <Row label="XP Reward" value={`${xpReward} XP`} />
        <div className="flex items-center justify-between gap-3">
          <dt className="text-neutral-variant">Status</dt>
          <dd>
            <StatusPill status={status} />
          </dd>
        </div>
      </dl>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-neutral-variant">{label}</dt>
      <dd className="text-right font-extrabold text-neutral">{value}</dd>
    </div>
  );
}

function StatusPill({ status }: { status: LessonStatus }) {
  const classes =
    status === 'draft'
      ? 'border-primary-border bg-primary-softer text-primary'
      : status === 'published'
        ? 'border-success/40 bg-success/10 text-success'
        : 'border-border bg-neutral-soft text-neutral-variant';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${classes}`}
    >
      {LESSON_STATUS_LABELS[status]}
    </span>
  );
}
