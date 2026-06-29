import { Link } from 'react-router-dom';
import { COUNTRIES } from '@lexiroot/shared';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../../ui/Table';
import { useListUsersQuery } from '../../../services/usersApi';
import { formatDate } from '../../../utils/format';

interface RecentUsersCardProps {
  /** When set, the card searches the user table instead of listing recent users. */
  search?: string;
}

export function RecentUsersCard({ search }: RecentUsersCardProps) {
  const searching = !!search;
  const { data, isLoading } = useListUsersQuery({ page: 1, limit: searching ? 8 : 5, search });
  const rows = data?.items ?? [];

  return (
    <TableContainer>
      <div className="flex items-center justify-between px-4 py-4">
        <h3 className="text-sm font-bold text-neutral">
          {searching ? 'Search Results' : 'Recent Users'}
        </h3>
        <Link to="/users" className="text-xs font-semibold text-primary hover:underline">
          View all Users →
        </Link>
      </div>
      <Table minWidth={620}>
        <TableHead>
          <tr>
            <TableHeaderCell>User</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Joined At</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Country</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {isLoading && rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-6 text-center text-neutral-variant">
                Loading…
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-6 text-center text-neutral-variant">
                {searching ? `No users match “${search}”.` : 'No users yet.'}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.displayName} size={28} />
                    <span className="font-semibold text-neutral">{u.displayName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-neutral-variant">{u.email}</TableCell>
                <TableCell className="text-neutral-variant">{formatDate(u.createdAt)}</TableCell>
                <TableCell>
                  {u.isActive ? (
                    <Badge tone="success">Active</Badge>
                  ) : (
                    <Badge tone="neutral">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {u.country ? (
                    <span className="inline-flex items-center gap-1.5 text-neutral-variant">
                      <span className="text-base">{COUNTRIES[u.country].flag}</span>
                      <span>{COUNTRIES[u.country].name}</span>
                    </span>
                  ) : (
                    <span className="text-neutral-variant">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
