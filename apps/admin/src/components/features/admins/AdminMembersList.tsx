import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ADMIN_ROLES, ADMIN_ROLE_LABELS, type AdminAccount, type AdminRole } from '@lexiroot/shared';
import { Badge } from '../../ui/Badge';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { SelectMenu } from '../../ui/SelectMenu';
import { useToast } from '../../ui/Toast';
import {
  useAdminMembersQuery,
  useRemoveAdminMemberMutation,
  useUpdateAdminRoleMutation,
} from '../../../services/adminsApi';
import { useAppSelector } from '../../../store/hooks';
import { formatRelative } from '../../../utils/format';

function errorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err && 'data' in err) {
    const msg = (err as { data?: { message?: string | string[] } }).data?.message;
    if (Array.isArray(msg)) return msg[0] ?? fallback;
    if (msg) return msg;
  }
  return fallback;
}

const ROLE_OPTIONS = ADMIN_ROLES.map((value) => ({ value, label: ADMIN_ROLE_LABELS[value] }));

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function MemberRow({ member, isSelf }: { member: AdminAccount; isSelf: boolean }) {
  const toast = useToast();
  const [updateRole, { isLoading: updating }] = useUpdateAdminRoleMutation();
  const [removeMember, { isLoading: removing }] = useRemoveAdminMemberMutation();
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function handleRole(role: AdminRole) {
    if (role === member.role) return;
    try {
      await updateRole({ id: member.id, role }).unwrap();
      toast.success(`${member.displayName} is now ${ADMIN_ROLE_LABELS[role]}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the role'));
    }
  }

  async function handleRemove() {
    try {
      await removeMember(member.id).unwrap();
      toast.success(`${member.displayName} removed`);
      setConfirmRemove(false);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not remove this member'));
      setConfirmRemove(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
            {initials(member.displayName)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-neutral">
            {member.displayName}
            {isSelf ? <span className="ml-2 text-xs font-medium text-neutral-variant">You</span> : null}
          </p>
          <p className="truncate text-xs text-neutral-variant">{member.email}</p>
        </div>
      </div>

      <Badge tone={member.role === 'admin' ? 'success' : 'neutral'}>
        {ADMIN_ROLE_LABELS[member.role]}
      </Badge>

      <p className="hidden text-xs text-neutral-variant sm:block">
        Active {formatRelative(member.lastActiveAt)}
      </p>

      {isSelf ? (
        <span className="text-xs text-neutral-variant">—</span>
      ) : (
        <div className="flex items-center gap-3">
          <span className={updating ? 'opacity-50' : ''}>
            <SelectMenu value={member.role} options={ROLE_OPTIONS} onChange={handleRole} />
          </span>
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            aria-label="Remove member"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-variant transition hover:bg-error/10 hover:text-error"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmRemove}
        title="Remove team member?"
        message={
          <>
            <span className="font-semibold text-neutral">{member.displayName}</span> will lose
            access to the dashboard. This can&apos;t be undone.
          </>
        }
        confirmLabel="Remove"
        destructive
        loading={removing}
        onConfirm={handleRemove}
        onClose={() => setConfirmRemove(false)}
      />
    </div>
  );
}

export function AdminMembersList() {
  const { data: members = [], isLoading } = useAdminMembersQuery();
  const currentUserId = useAppSelector((s) => s.auth.user?.id);

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-neutral-variant">Loading team…</div>;
  }

  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-neutral-variant">
        No team members yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {members.map((member) => (
        <MemberRow key={member.id} member={member} isSelf={member.id === currentUserId} />
      ))}
    </div>
  );
}
