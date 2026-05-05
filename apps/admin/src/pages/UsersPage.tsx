import { useEffect, useState } from 'react';
import { Eye, Flame, Pencil, Trash2 } from 'lucide-react';
import { COUNTRIES, LANGUAGE_LABELS, LEARNING_LEVEL_LABELS } from '@lexiroot/shared';
import { Avatar } from '../components/ui/Avatar';
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
import { useListUsersQuery, UserRow, UserStatusFilter } from '../services/usersApi';
import { formatDate, formatNumber, pluralize } from '../utils/format';
import { PageHeader } from '../components/layout/PageHeader';
import { UserStatsCards } from '../components/features/users/UserStatsCards';
import { SearchPopover } from '../components/features/users/SearchPopover';
import { FilterMenu } from '../components/features/users/FilterMenu';
import { Pagination } from '../components/features/users/Pagination';
import { UserOverviewModal } from '../components/features/users/UserOverviewModal';
import { EditUserModal } from '../components/features/users/EditUserModal';
import { DeleteUserModal } from '../components/features/users/DeleteUserModal';

const PAGE_SIZE = 12;

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput.trim(), 400);
  const [status, setStatus] = useState<UserStatusFilter | undefined>(undefined);

  const [viewing, setViewing] = useState<UserRow | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);

  // Reset to page 1 whenever the active query inputs change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const { data, isLoading, isFetching } = useListUsersQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Manage and monitor all registered users."
        actions={
          <>
            <SearchPopover value={searchInput} onChange={setSearchInput} />
            <FilterMenu value={status} onChange={setStatus} />
          </>
        }
      />

      <UserStatsCards />

      <TableContainer>
        <Table minWidth={1040}>
          <TableHead>
            <tr>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Country</TableHeaderCell>
              <TableHeaderCell>Language</TableHeaderCell>
              <TableHeaderCell>Join Date</TableHeaderCell>
              <TableHeaderCell>Level</TableHeaderCell>
              <TableHeaderCell>XP</TableHeaderCell>
              <TableHeaderCell>Streak</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <tr>
                <TableCell colSpan={10} className="py-10 text-center text-neutral-variant">
                  Loading…
                </TableCell>
              </tr>
            ) : data && data.items.length > 0 ? (
              data.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.displayName} size={32} />
                      <span className="font-semibold text-neutral">{user.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-variant">{user.email}</TableCell>
                  <TableCell className="text-neutral-variant">
                    {user.country ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-base">{COUNTRIES[user.country].flag}</span>
                        <span>{COUNTRIES[user.country].name}</span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-neutral-variant">
                    {user.language ? LANGUAGE_LABELS[user.language] : '—'}
                  </TableCell>
                  <TableCell className="text-neutral-variant">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-neutral-variant">
                    {user.level ? LEARNING_LEVEL_LABELS[user.level] : '—'}
                  </TableCell>
                  <TableCell className="text-neutral-variant">
                    {formatNumber(user.xp)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-neutral-variant">
                      <Flame size={14} className="text-primary" />
                      {pluralize(user.currentStreakDays, 'day')}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="error">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-neutral-variant">
                      <button
                        className="rounded p-1.5 hover:bg-neutral-soft hover:text-neutral"
                        title="View"
                        type="button"
                        onClick={() => setViewing(user)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="rounded p-1.5 hover:bg-neutral-soft hover:text-neutral"
                        title="Edit"
                        type="button"
                        onClick={() => setEditing(user)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="rounded p-1.5 hover:bg-error/10 hover:text-error"
                        title="Delete"
                        type="button"
                        onClick={() => setDeleting(user)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <tr>
                <TableCell colSpan={10} className="py-10 text-center text-neutral-variant">
                  No users found.
                </TableCell>
              </tr>
            )}
          </TableBody>
        </Table>
        {data ? (
          <TableFooter>
            <span>
              Showing {data.items.length === 0 ? 0 : (data.page - 1) * data.limit + 1} to{' '}
              {Math.min(data.page * data.limit, data.total)} of {data.total} users
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

      <UserOverviewModal user={viewing} onClose={() => setViewing(null)} />
      <EditUserModal user={editing} onClose={() => setEditing(null)} />
      <DeleteUserModal user={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
