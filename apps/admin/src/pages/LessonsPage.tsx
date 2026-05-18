import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LEARNING_LEVEL_LABELS,
  LESSON_STATUS_LABELS,
  LESSON_TYPE_LABELS,
  type LanguageCode,
  type LearningLevel,
  type LessonStatus,
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
import { useDebounce } from '../hooks/useDebounce';
import {
  useArchiveLessonMutation,
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

type Tab = 'all' | 'published' | 'draft';

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'All Lessons' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

function statusBadge(status: LessonStatus) {
  const tone = status === 'published' ? 'success' : status === 'draft' ? 'warning' : 'neutral';
  return <Badge tone={tone}>{LESSON_STATUS_LABELS[status]}</Badge>;
}

export function LessonsPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput.trim(), 400);
  const [language, setLanguage] = useState<LanguageCode | undefined>(undefined);
  const [tier, setTier] = useState<LearningLevel | undefined>(undefined);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, language, tier, tab]);

  const status = useMemo<LessonStatus | undefined>(() => {
    if (tab === 'all') return undefined;
    return tab;
  }, [tab]);

  const { data, isLoading, isFetching } = useListLessonsQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    language,
    tier,
    status,
  });

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
              to="/lessons/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              <Plus size={16} />
              Create Lesson
            </Link>
          </>
        }
      />

      <LessonStatsCards />

      <div className="border-b border-border">
        <div className="flex gap-6">
          {TABS.map((t) => {
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
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
              <TableHeaderCell>Tier</TableHeaderCell>
              <TableHeaderCell>Level</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
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
                  No lessons yet. Click <span className="font-semibold">Create Lesson</span> to add one.
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
  const [archive, { isLoading: archiving }] = useArchiveLessonMutation();

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
            onClick={() => archive(lesson.id)}
            className="rounded p-1.5 hover:bg-error/10 hover:text-error disabled:opacity-40"
            title={lesson.status === 'archived' ? 'Already archived' : 'Archive'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
