import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LEARNING_LEVELS,
  LEARNING_LEVEL_LABELS,
  LESSON_STATUSES,
  LESSON_STATUS_LABELS,
  LESSON_TYPES,
  LESSON_TYPE_LABELS,
  type LanguageCode,
  type LearningLevel,
  type LessonStatus,
  type LessonType,
} from '@lexiroot/shared';
import { Badge } from '../components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../components/ui/Table';
import { ColumnFilter } from '../components/ui/ColumnFilter';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { useDebounce } from '../hooks/useDebounce';
import {
  useArchiveLessonMutation,
  useLessonSlotsQuery,
  useListLessonsQuery,
  type LessonRow,
} from '../services/lessonsApi';
import { formatDate } from '../utils/format';
import { PageHeader } from '../components/layout/PageHeader';
import { LessonStatsCards } from '../components/features/lessons/LessonStatsCards';
import { LessonSearchPopover } from '../components/features/lessons/LessonSearchPopover';
import { LessonFilterMenu } from '../components/features/lessons/LessonFilterMenu';
import { Pagination } from '../components/features/users/Pagination';

const PAGE_SIZE = 12;

const TABS: { value: LessonStatus | undefined; label: string }[] = [
  { value: undefined, label: 'All Lessons' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

type SkillTab = 'all' | LessonType;

const SKILL_TABS: { value: SkillTab; label: string }[] = [
  { value: 'all', label: 'All skills' },
  { value: 'letters-numbers', label: 'Letters & Numbers' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'recognition', label: 'Recognition' },
  { value: 'sentence', label: 'Sentence' },
  { value: 'exercise', label: 'Exercise' },
];

function statusBadge(status: LessonStatus) {
  const tone = status === 'published' ? 'success' : status === 'draft' ? 'warning' : 'neutral';
  return <Badge tone={tone}>{LESSON_STATUS_LABELS[status]}</Badge>;
}

export function LessonsPage() {
  // The status tabs and the Status column filter share this value; 'archived'
  // is reachable only from the column filter.
  const [status, setStatus] = useState<LessonStatus | undefined>(undefined);
  const [skillTab, setSkillTab] = useState<SkillTab>('all');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput.trim(), 400);
  const [language, setLanguage] = useState<LanguageCode | undefined>(undefined);
  const [tier, setTier] = useState<LearningLevel | undefined>(undefined);
  const [level, setLevel] = useState<number | undefined>(undefined);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, language, tier, level, status, skillTab]);

  const typeFilter = useMemo<LessonType | undefined>(() => {
    return skillTab === 'all' ? undefined : skillTab;
  }, [skillTab]);

  // Level options are the levels that actually have lessons, narrowed by the
  // tier and type filters so the list only offers choices that return rows.
  const { data: slots } = useLessonSlotsQuery(language);
  const levelOptions = useMemo(() => {
    const levels = new Set(
      (slots ?? [])
        .filter((s) => (!tier || s.tier === tier) && (!typeFilter || s.type === typeFilter))
        .map((s) => s.level),
    );
    if (level !== undefined) levels.add(level);
    return [...levels].sort((a, b) => a - b).map((l) => ({ value: l, label: `Level ${l}` }));
  }, [slots, tier, typeFilter, level]);

  const createHref = skillTab === 'all' ? '/lessons/new' : `/lessons/new?type=${skillTab}`;

  const { data, isLoading, isFetching } = useListLessonsQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    language,
    tier,
    status,
    type: typeFilter,
  });

  const hasFilters =
    !!debouncedSearch || !!language || !!tier || level !== undefined || !!status || !!typeFilter;

  function clearFilters() {
    setSearchInput('');
    setLanguage(undefined);
    setTier(undefined);
    setLevel(undefined);
    setStatus(undefined);
    setSkillTab('all');
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lessons"
        subtitle="Create, manage and organize lessons for effective learning."
        actions={
          <>
            <LessonSearchPopover value={searchInput} onChange={setSearchInput} />
            <LessonFilterMenu
              language={language}
              tier={tier}
              onLanguageChange={setLanguage}
              onTierChange={setTier}
            />
            <Link
              to={createHref}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              <Plus size={16} />
              Create Lesson
            </Link>
          </>
        }
      />

      <LessonStatsCards />

      <div className="flex flex-wrap items-center gap-2">
        {SKILL_TABS.map((t) => {
          const active = skillTab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setSkillTab(t.value)}
              className={`inline-flex h-9 items-center rounded-full border px-3 text-xs font-semibold transition ${
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-white text-neutral hover:bg-neutral-soft'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="border-b border-border">
        <div className="flex gap-6">
          {TABS.map((t) => {
            const active = status === t.value;
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => setStatus(t.value)}
                className={`relative pb-3 text-sm font-semibold transition ${
                  active ? 'text-primary' : 'text-neutral-variant hover:text-neutral'
                }`}
              >
                {t.label}
                {active ? (
                  <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <TableContainer>
        <Table minWidth={1040}>
          <TableHead>
            <tr>
              <TableHeaderCell>Lesson</TableHeaderCell>
              <TableHeaderCell>
                <ColumnFilter
                  label="Tier"
                  allLabel="All tiers"
                  value={tier}
                  options={LEARNING_LEVELS.map((t) => ({
                    value: t,
                    label: LEARNING_LEVEL_LABELS[t],
                  }))}
                  onChange={setTier}
                />
              </TableHeaderCell>
              <TableHeaderCell>
                <ColumnFilter
                  label="Level"
                  allLabel="All levels"
                  value={level}
                  options={levelOptions}
                  onChange={setLevel}
                />
              </TableHeaderCell>
              <TableHeaderCell>
                <ColumnFilter
                  label="Type"
                  allLabel="All types"
                  value={typeFilter}
                  options={LESSON_TYPES.map((t) => ({ value: t, label: LESSON_TYPE_LABELS[t] }))}
                  onChange={(next) => setSkillTab(next ?? 'all')}
                />
              </TableHeaderCell>
              <TableHeaderCell>
                <ColumnFilter
                  label="Status"
                  allLabel="All statuses"
                  value={status}
                  options={LESSON_STATUSES.map((s) => ({
                    value: s,
                    label: LESSON_STATUS_LABELS[s],
                  }))}
                  onChange={setStatus}
                />
              </TableHeaderCell>
              <TableHeaderCell>XP Reward</TableHeaderCell>
              <TableHeaderCell>Created At</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <tr>
                <TableCell colSpan={8} className="py-10 text-center text-neutral-variant">
                  Loading…
                </TableCell>
              </tr>
            ) : data && data.items.length > 0 ? (
              data.items.map((lesson) => <LessonRowItem key={lesson.id} lesson={lesson} />)
            ) : (
              <tr>
                <TableCell colSpan={8} className="py-10 text-center text-neutral-variant">
                  {hasFilters ? (
                    <>
                      No lessons match these filters.{' '}
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="font-semibold text-primary hover:underline"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <>
                      No lessons yet. Click <span className="font-semibold">Create Lesson</span> to
                      add one.
                    </>
                  )}
                </TableCell>
              </tr>
            )}
          </TableBody>
        </Table>
        {data ? (
          <TableFooter>
            <span>
              Showing {data.items.length === 0 ? 0 : (data.page - 1) * data.limit + 1} to{' '}
              {Math.min(data.page * data.limit, data.total)} of {data.total} lessons
            </span>
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
              disabled={isFetching}
            />
          </TableFooter>
        ) : null}
      </TableContainer>
    </div>
  );
}

function LessonRowItem({ lesson }: { lesson: LessonRow }) {
  const toast = useToast();
  const [archive, { isLoading: archiving }] = useArchiveLessonMutation();
  const [confirmArchive, setConfirmArchive] = useState(false);

  async function handleArchive() {
    try {
      await archive(lesson.id).unwrap();
      toast.success(`"${lesson.title}" archived`);
      setConfirmArchive(false);
    } catch {
      toast.error('Could not archive this lesson');
      setConfirmArchive(false);
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 shrink-0 rounded-md bg-neutral-soft" aria-hidden />
          <div className="min-w-0">
            <div className="truncate font-semibold text-neutral">{lesson.title}</div>
            <div className="truncate text-xs text-neutral-variant">{lesson.shortDescription}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-neutral-variant">{LEARNING_LEVEL_LABELS[lesson.tier]}</TableCell>
      <TableCell className="text-neutral-variant">Level {lesson.level}</TableCell>
      <TableCell className="text-neutral-variant">{LESSON_TYPE_LABELS[lesson.type]}</TableCell>
      <TableCell>{statusBadge(lesson.status)}</TableCell>
      <TableCell className="text-neutral-variant">{lesson.xpReward} XP</TableCell>
      <TableCell className="text-neutral-variant">{formatDate(lesson.createdAt)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-neutral-variant">
          <Link
            to={`/lessons/${lesson.id}/edit`}
            className="rounded p-1.5 hover:bg-neutral-soft hover:text-neutral"
            title="View"
          >
            <Eye size={16} />
          </Link>
          <Link
            to={`/lessons/${lesson.id}/edit`}
            className="rounded p-1.5 hover:bg-neutral-soft hover:text-neutral"
            title="Edit"
          >
            <Pencil size={16} />
          </Link>
          <button
            type="button"
            disabled={lesson.status === 'archived' || archiving}
            onClick={() => setConfirmArchive(true)}
            className="rounded p-1.5 hover:bg-error/10 hover:text-error disabled:opacity-40"
            title={lesson.status === 'archived' ? 'Already archived' : 'Archive'}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <ConfirmDialog
          open={confirmArchive}
          title="Archive this lesson?"
          message={
            <>
              <span className="font-semibold text-neutral">{lesson.title}</span> will be hidden from
              learners. You can republish it later.
            </>
          }
          confirmLabel="Archive"
          destructive
          loading={archiving}
          onConfirm={handleArchive}
          onClose={() => setConfirmArchive(false)}
        />
      </TableCell>
    </TableRow>
  );
}
