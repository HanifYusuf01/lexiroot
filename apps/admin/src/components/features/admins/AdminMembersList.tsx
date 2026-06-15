import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ADMIN_ROLES, ADMIN_ROLE_LABELS, type AdminAccount, type AdminRole } from '@lexiroot/shared';
import { Badge } from '../../ui/Badge';
import { SelectMenu } from '../../ui/SelectMenu';
import {
  useAdminMembersQuery,
  useRemoveAdminMemberMutation,
  useUpdateAdminRoleMutation,
} from '../../../services/adminsApi';
import { useAppSelector } from '../../../store/hooks';
import { formatRelative } from '../../../utils/format';

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
  const [updateRole, { isLoading: updating }] = useUpdateAdminRoleMutation();
  const [removeMember, { isLoading: removing }] = useRemoveAdminMemberMutation();
  const [confirmRemove, setConfirmRemove] = useState(false);

  function handleRole(role: AdminRole) {
    if (role === member.role) return;
    void updateRole({ id: member.id, role });
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
          {confirmRemove ? (
            <span className="flex items-center gap-2 text-xs font-semibold">
              <button
                type="button"
                disabled={removing}
                onClick={() => removeMember(member.id)}
                className="text-error hover:underline disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                className="text-neutral-variant hover:text-neutral"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              aria-label="Remove member"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-variant transition hover:bg-error/10 hover:text-error"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
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
