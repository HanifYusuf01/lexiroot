import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { SelectMenu } from '../components/ui/SelectMenu';
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
import { Pagination } from '../components/features/users/Pagination';
import { formatDate, formatTimeOfDay, type DateRange } from '../utils/format';

type ActionFilter = 'all' | 'created-user' | 'updated-lesson' | 'sent-notification' | 'deleted-user' | 'uploaded-content' | 'updated-setting';
type AdminFilter = 'all' | string;

interface ActivityEntry {
  id: string;
  timestamp: string;
  admin: { id: string; name: string };
  action: { value: Exclude<ActionFilter, 'all'>; label: string };
  details: string;
}

const PAGE_SIZE = 9;

const ADMINS = [
  { id: 'a1', name: 'Olayinka Idris' },
  { id: 'a2', name: 'Fatimah Bello' },
  { id: 'a3', name: 'Tunde Bisiriyu' },
  { id: 'a4', name: 'Ajagbe Mercy' },
  { id: 'a5', name: 'Stanley Ugo' },
  { id: 'a6', name: 'Ahmed Bala' },
];

const ACTION_TEMPLATES: ActivityEntry['action'][] = [
  { value: 'created-user', label: 'Created User' },
  { value: 'updated-lesson', label: 'Updated Lesson' },
  { value: 'sent-notification', label: 'Sent Notification' },
  { value: 'deleted-user', label: 'Deleted User' },
  { value: 'uploaded-content', label: 'Uploaded Content' },
  { value: 'updated-setting', label: 'Updated Setting' },
];

const DETAIL_FOR: Record<ActivityEntry['action']['value'], string> = {
  'created-user': 'New user account created successfully.',
  'updated-lesson': 'Lesson content and audio updated.',
  'sent-notification': 'Push notification about new daily challenge.',
  'deleted-user': 'User account deleted (inactivity).',
  'uploaded-content': 'New cultural story with audio uploaded.',
  'updated-setting': 'Updated subscription price for premium plan.',
};

/** Generate a deterministic mock dataset so dev experience is stable. */
function buildMockEntries(count: number): ActivityEntry[] {
  const baseDate = new Date(2026, 4, 18, 10, 24);
  return Array.from({ length: count }, (_, i) => {
    const action = ACTION_TEMPLATES[i % ACTION_TEMPLATES.length]!;
    const admin = ADMINS[i % ADMINS.length]!;
    const timestamp = new Date(baseDate);
    timestamp.setDate(baseDate.getDate() - i * 3);
    return {
      id: `act-${i + 1}`,
      timestamp: timestamp.toISOString(),
      admin,
      action,
      details: DETAIL_FOR[action.value],
    };
  });
}

const ALL_ENTRIES = buildMockEntries(126);

function defaultRange(): DateRange {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start, end };
}

export function ActivityLogPage() {
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [adminFilter, setAdminFilter] = useState<AdminFilter>('all');
  const [page, setPage] = useState(1);

  const actionOptions = useMemo(
    () => [
      { value: 'all' as const, label: 'All actions' },
      ...ACTION_TEMPLATES.map((a) => ({ value: a.value, label: a.label })),
    ],
    [],
  );

  const adminOptions = useMemo(
    () => [
      { value: 'all', label: 'All admins' },
      ...ADMINS.map((a) => ({ value: a.id, label: a.name })),
    ],
    [],
  );

  const filtered = useMemo(() => {
    return ALL_ENTRIES.filter((entry) => {
      if (actionFilter !== 'all' && entry.action.value !== actionFilter) return false;
      if (adminFilter !== 'all' && entry.admin.id !== adminFilter) return false;
      return true;
    });
  }, [actionFilter, adminFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        subtitle="Track all important actions and changes across the platform."
        actions={
          <>
            <DateRangePicker value={range} onApply={setRange} />
            <SelectMenu<ActionFilter>
              value={actionFilter}
              options={actionOptions}
              onChange={(v) => {
                setActionFilter(v);
                setPage(1);
              }}
            />
            <SelectMenu<AdminFilter>
              value={adminFilter}
              options={adminOptions}
              onChange={(v) => {
                setAdminFilter(v);
                setPage(1);
              }}
            />
          </>
        }
      />

      <TableContainer>
        <Table minWidth={760}>
          <TableHead>
            <tr>
              <TableHeaderCell>Time</TableHeaderCell>
              <TableHeaderCell>Admin</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
              <TableHeaderCell>Details</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-neutral-variant">
                  No activity for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="font-semibold text-neutral">{formatDate(entry.timestamp)}</div>
                    <div className="text-[11px] text-neutral-variant">
                      {formatTimeOfDay(entry.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={entry.admin.name} size={28} />
                      <span className="font-semibold text-neutral">{entry.admin.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-neutral">{entry.action.label}</TableCell>
                  <TableCell className="text-neutral-variant">{entry.details}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TableFooter>
          <span className="text-xs text-neutral-variant">
            Showing {filtered.length === 0 ? 0 : pageStart + 1} to{' '}
            {Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} Activities
          </span>
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </TableFooter>
      </TableContainer>
    </div>
  );
}
