import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { AdminMembersList } from '../components/features/admins/AdminMembersList';
import { InviteAdminForm } from '../components/features/admins/InviteAdminForm';
import { PendingInvitationsList } from '../components/features/admins/PendingInvitationsList';

export function AdminManagementPage() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Admin Management"
        subtitle="Invite teammates and manage who can access the dashboard."
      />

      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral">Team members</h2>
            <p className="mt-0.5 text-xs text-neutral-variant">
              Admins have full access; instructors manage lessons and cultural content.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInviteOpen((open) => !open)}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            {inviteOpen ? 'Close' : 'Invite Member'}
          </button>
        </div>

        {inviteOpen ? <InviteAdminForm onClose={() => setInviteOpen(false)} /> : null}

        <div className="mt-5">
          <AdminMembersList />
        </div>
      </section>

      <section>
        <h2 className="text-base font-bold text-neutral">Pending invitations</h2>
        <p className="mt-0.5 text-xs text-neutral-variant">
          Invitations that haven’t been accepted yet.
        </p>
        <div className="mt-5">
          <PendingInvitationsList />
        </div>
      </section>
    </div>
  );
}
