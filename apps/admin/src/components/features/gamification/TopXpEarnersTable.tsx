import type { TopXpEarner } from '@lexiroot/shared';
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
import { formatNumber } from '../../../utils/format';

interface Props {
  items: TopXpEarner[];
  loading?: boolean;
  showEmail?: boolean;
}

function rankBadge(rank: number) {
  if (rank === 1) return <span title="1st" aria-label="1st">🥇</span>;
  if (rank === 2) return <span title="2nd" aria-label="2nd">🥈</span>;
  if (rank === 3) return <span title="3rd" aria-label="3rd">🥉</span>;
  return <span className="font-bold text-neutral">{rank}</span>;
}

export function TopXpEarnersTable({ items, loading, showEmail = false }: Props) {
  return (
    <TableContainer>
      <Table minWidth={720}>
        <TableHead>
          <tr>
            <TableHeaderCell className="w-16">Rank</TableHeaderCell>
            <TableHeaderCell>User</TableHeaderCell>
            <TableHeaderCell>Total XP</TableHeaderCell>
            <TableHeaderCell>Level</TableHeaderCell>
            <TableHeaderCell>Streak</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {loading ? (
            <tr>
              <TableCell colSpan={5} className="py-10 text-center text-neutral-variant">
                Loading…
              </TableCell>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <TableCell colSpan={5} className="py-10 text-center text-neutral-variant">
                No data yet.
              </TableCell>
            </tr>
          ) : (
            items.map((row) => (
              <TableRow key={row.userId}>
                <TableCell className="text-center text-base">{rankBadge(row.rank)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={row.displayName} src={row.avatarUrl} size={32} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-neutral">{row.displayName}</div>
                      {showEmail ? (
                        <div className="truncate text-xs text-neutral-variant">{row.email}</div>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-neutral">
                  {formatNumber(row.totalXp)} XP
                </TableCell>
                <TableCell>
                  <Badge tone="success">Lv. {row.level}</Badge>
                </TableCell>
                <TableCell className="text-neutral-variant">
                  <span className="inline-flex items-center gap-1">
                    🔥 {row.currentStreakDays === 0 ? 'Reset' : `${row.currentStreakDays} days`}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
