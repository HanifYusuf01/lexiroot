import { useEffect, useMemo, useState } from 'react';
import { Eye, MoreVertical, Pencil, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  CULTURAL_CONTENT_TYPE_LABELS,
  CULTURAL_CONTENT_STATUS_LABELS,
  LANGUAGE_LABELS,
  LEARNING_LEVEL_LABELS,
  type CulturalContentStatus,
  type CulturalContentType,
  type LanguageCode,
  type LearningLevel,
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
  useListCulturalContentQuery,
  type CulturalContentRow,
} from '../services/culturalContentApi';
import { formatDate, formatNumber } from '../utils/format';
import { PageHeader } from '../components/layout/PageHeader';
import { CulturalContentStatsCards } from '../components/features/cultural-content/CulturalContentStatsCards';
import { CulturalContentSearchPopover } from '../components/features/cultural-content/CulturalContentSearchPopover';
import { CulturalContentFilterMenu } from '../components/features/cultural-content/CulturalContentFilterMenu';
import { Pagination } from '../components/features/users/Pagination';

const PAGE_SIZE = 12;

type TypeTab = 'all' | CulturalContentType;

const TYPE_TABS: { value: TypeTab; label: string; path: string }[] = [
  { value: 'all', label: 'All Content', path: '/cultural-content' },
  { value: 'folktale', label: 'Folktales', path: '/cultural-content/folktales' },
  { value: 'proverb', label: 'Proverbs', path: '/cultural-content/proverbs' },
  { value: 'story', label: 'Stories', path: '/cultural-content/stories' },
];

function pathToTypeTab(pathname: string): TypeTab {
  if (pathname.endsWith('/folktales')) return 'folktale';
  if (pathname.endsWith('/proverbs')) return 'proverb';
  if (pathname.endsWith('/stories')) return 'story';
  return 'all';
}

function statusBadge(status: CulturalContentStatus) {
  const tone = status === 'published' ? 'success' : status === 'draft' ? 'warning' : 'neutral';
  return <Badge tone={tone}>{CULTURAL_CONTENT_STATUS_LABELS[status]}</Badge>;
}

function typeBadge(type: CulturalContentType) {
  if (type === 'story') {
    return (
      <Badge tone="neutral" style={{ backgroundColor: '#E5E4FF', color: '#060099' }}>
        {CULTURAL_CONTENT_TYPE_LABELS[type]}
      </Badge>
    );
  }

  const tone: 'success' | 'warning' | 'neutral' =
    type === 'folktale' ? 'success' : type === 'proverb' ? 'warning' : 'neutral';
  return <Badge tone={tone}>{CULTURAL_CONTENT_TYPE_LABELS[type]}</Badge>;
}

export function CulturalContentPage() {
  const { pathname } = useLocation();
  const typeTab = pathToTypeTab(pathname);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput.trim(), 400);
  const [language, setLanguage] = useState<LanguageCode | undefined>(undefined);
  const [tier, setTier] = useState<LearningLevel | undefined>(undefined);
  const [status, setStatus] = useState<CulturalContentStatus | undefined>(undefined);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, language, tier, status, typeTab]);

  const typeFilter = useMemo<CulturalContentType | undefined>(() => {
    return typeTab === 'all' ? undefined : typeTab;
  }, [typeTab]);

  const createHref =
    typeTab === 'all' ? '/cultural-content/new' : `/cultural-content/new?type=${typeTab}`;

  const { data, isLoading, isFetching } = useListCulturalContentQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    language,
    tier,
    status,
    type: typeFilter,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cultural Content"
        subtitle="Create, manage and organize cultural content for LexiRoot learners."
        actions={
          <>
            <CulturalContentSearchPopover value={searchInput} onChange={setSearchInput} />
            <CulturalContentFilterMenu
              language={language}
              tier={tier}
              status={status}
              onLanguageChange={setLanguage}
              onTierChange={setTier}
              onStatusChange={setStatus}
            />
            <Link
              to={createHref}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              <Plus size={16} />
              Add content
            </Link>
          </>
        }
      />

      <CulturalContentStatsCards />

      <div className="border-b border-border">
        <div className="flex gap-6">
          {TYPE_TABS.map((t) => {
            const active = typeTab === t.value;
            return (
              <Link
                key={t.value}
                to={t.path}
                className={`relative pb-3 text-sm font-semibold transition ${
                  active ? 'text-primary' : 'text-neutral-variant hover:text-neutral'
                }`}
              >
                {t.label}
                {active ? (
                  <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      <TableContainer>
        <Table minWidth={1120}>
          <TableHead>
            <tr>
              <TableHeaderCell>Content</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Language</TableHeaderCell>
              <TableHeaderCell>Level</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Published At</TableHeaderCell>
              <TableHeaderCell>Views</TableHeaderCell>
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
              data.items.map((item) => <CulturalContentRowItem key={item.id} item={item} />)
            ) : (
              <tr>
                <TableCell colSpan={8} className="py-10 text-center text-neutral-variant">
                  No content yet. Click <span className="font-semibold">Add content</span> to
                  create one.
                </TableCell>
              </tr>
            )}
          </TableBody>
        </Table>
        {data ? (
          <TableFooter>
            <span>
              Showing {data.items.length === 0 ? 0 : (data.page - 1) * data.limit + 1} to{' '}
              {Math.min(data.page * data.limit, data.total)} of {data.total} items
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

function CulturalContentRowItem({ item }: { item: CulturalContentRow }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3" style={{ maxWidth: 360 }}>
          {item.coverImageUrl ? (
            <img
              src={item.coverImageUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-md object-cover"
            />
          ) : (
            <span className="h-9 w-9 shrink-0 rounded-md bg-neutral-soft" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-neutral">{item.titleEnglish}</div>
            <div className="truncate text-xs text-neutral-variant">
              {item.shortDescription || item.titleTranslated || '—'}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>{typeBadge(item.type)}</TableCell>
      <TableCell className="text-neutral-variant">{LANGUAGE_LABELS[item.language]}</TableCell>
      <TableCell className="text-neutral-variant">{LEARNING_LEVEL_LABELS[item.tier]}</TableCell>
      <TableCell>{statusBadge(item.status)}</TableCell>
      <TableCell className="text-neutral-variant">
        {formatDate(item.publishedAt ?? item.createdAt)}
      </TableCell>
      <TableCell className="text-neutral-variant">{formatNumber(item.views)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-neutral-variant">
          <Link
            to={`/cultural-content/${item.id}/edit`}
            className="rounded p-1.5 hover:bg-neutral-soft hover:text-neutral"
            title="View"
          >
            <Eye size={16} />
          </Link>
          <Link
            to={`/cultural-content/${item.id}/edit`}
            className="rounded p-1.5 hover:bg-neutral-soft hover:text-neutral"
            title="Edit"
          >
            <Pencil size={16} />
          </Link>
          <button
            type="button"
            className="rounded p-1.5 hover:bg-neutral-soft hover:text-neutral"
            title="More"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
