import type { SubscriptionStatus } from '@lexiroot/shared';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../components/ui/Table';
import { useSubscriptionsQuery } from '../services/subscriptionsApi';
import { formatDate } from '../utils/format';

// Status → pill styling. Uses semantic tokens only (no arbitrary values).
const STATUS_STYLE: Record<SubscriptionStatus, string> = {
  ACTIVE: 'bg-success text-success-foreground',
  TRIALING: 'bg-accent text-accent-foreground',
  PAST_DUE: 'bg-warning text-warning-foreground',
  INCOMPLETE: 'bg-neutral-soft text-neutral-variant',
  PAUSED: 'bg-neutral-soft text-neutral-variant',
  CANCELED: 'bg-error text-error-foreground',
  EXPIRED: 'bg-neutral-soft text-neutral-variant',
};

export function SubscriptionsPage() {
  const { data: subscriptions, isLoading } = useSubscriptionsQuery();

  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" subtitle="All learner subscriptions across providers." />

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Plan</TableHeaderCell>
              <TableHeaderCell>Provider</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Renews / ends</TableHeaderCell>
              <TableHeaderCell>Started</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-neutral-variant">
                  Loading…
                </TableCell>
              </TableRow>
            ) : !subscriptions || subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-neutral-variant">
                  No subscriptions yet.
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="font-semibold text-neutral">{sub.userDisplayName}</div>
                    <div className="text-xs text-neutral-variant">{sub.userEmail}</div>
                  </TableCell>
                  <TableCell>{sub.planName ?? '—'}</TableCell>
                  <TableCell className="capitalize">{sub.provider}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[sub.status]}`}
                    >
                      {sub.statusText}
                      {sub.cancelAtPeriodEnd && sub.status === 'ACTIVE' ? ' (cancelling)' : ''}
                    </span>
                  </TableCell>
                  <TableCell>{sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : '—'}</TableCell>
                  <TableCell>{formatDate(sub.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
