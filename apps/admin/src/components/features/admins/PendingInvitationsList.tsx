import { Mail, RotateCw, Trash2 } from 'lucide-react';
import {
  ADMIN_ROLE_LABELS,
  type AdminInvitation,
  type AdminInvitationStatus,
} from '@lexiroot/shared';
import { Badge } from '../../ui/Badge';
import {
  useAdminInvitationsQuery,
  useResendAdminInvitationMutation,
  useRevokeAdminInvitationMutation,
} from '../../../services/adminsApi';
import { formatDate } from '../../../utils/format';

const STATUS_TONE: Record<AdminInvitationStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  accepted: 'success',
  expired: 'error',
};

const STATUS_LABEL: Record<AdminInvitationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
};

function InvitationRow({ invitation }: { invitation: AdminInvitation }) {
  const [resend, { isLoading: resending }] = useResendAdminInvitationMutation();
  const [revoke, { isLoading: revoking }] = useRevokeAdminInvitationMutation();
  const open = invitation.status !== 'accepted';

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-soft text-neutral-variant">
        <Mail size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-neutral">{invitation.displayName}</p>
        <p className="truncate text-xs text-neutral-variant">{invitation.email}</p>
      </div>

      <Badge tone="neutral">{ADMIN_ROLE_LABELS[invitation.role]}</Badge>
      <Badge tone={STATUS_TONE[invitation.status]}>{STATUS_LABEL[invitation.status]}</Badge>

      <p className="hidden text-xs text-neutral-variant sm:block">
        {invitation.status === 'accepted'
          ? `Joined ${formatDate(invitation.acceptedAt)}`
          : `Expires ${formatDate(invitation.expiresAt)}`}
      </p>

      {open ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={resending}
            onClick={() => resend(invitation.id)}
            aria-label="Resend invitation"
            title="Resend invitation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-variant transition hover:bg-neutral-soft hover:text-neutral disabled:opacity-50"
          >
            <RotateCw size={16} />
          </button>
          <button
            type="button"
            disabled={revoking}
            onClick={() => revoke(invitation.id)}
            aria-label="Revoke invitation"
            title="Revoke invitation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-variant transition hover:bg-error/10 hover:text-error disabled:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function PendingInvitationsList() {
  const { data: invitations = [], isLoading } = useAdminInvitationsQuery();
  // Hide accepted invitations — those people show up in the team list instead.
  const open = invitations.filter((i) => i.status !== 'accepted');

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-neutral-variant">Loading invitations…</div>;
  }

  if (open.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-neutral-variant">
        No pending invitations.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {open.map((invitation) => (
        <InvitationRow key={invitation.id} invitation={invitation} />
      ))}
    </div>
  );
}
