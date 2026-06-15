import { FormEvent, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import {
  ADMIN_ROLES,
  ADMIN_ROLE_DESCRIPTIONS,
  ADMIN_ROLE_LABELS,
  type AdminRole,
  type CountryCode,
} from '@lexiroot/shared';
import { Button } from '../../ui/Button';
import { CountrySelect } from '../../ui/CountrySelect';
import { SelectMenu } from '../../ui/SelectMenu';
import { TextField } from '../../ui/TextField';
import { useCreateAdminInvitationMutation } from '../../../services/adminsApi';

interface InviteAdminFormProps {
  onClose: () => void;
}

const ROLE_OPTIONS = ADMIN_ROLES.map((value) => ({ value, label: ADMIN_ROLE_LABELS[value] }));

export function InviteAdminForm({ onClose }: InviteAdminFormProps) {
  const [createInvitation, { isLoading }] = useCreateAdminInvitationMutation();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('instructor');
  const [country, setCountry] = useState<CountryCode | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [sentTo, setSentTo] = useState<string | undefined>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (displayName.trim().length < 2) {
      setError('Please enter the person’s full name');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    try {
      await createInvitation({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        role,
        country,
      }).unwrap();
      setSentTo(email.trim().toLowerCase());
      setDisplayName('');
      setEmail('');
      setRole('instructor');
      setCountry(null);
    } catch (err) {
      const e = err as { data?: { message?: string | string[] } };
      const message = Array.isArray(e.data?.message) ? e.data?.message[0] : e.data?.message;
      setError(message ?? 'Could not send invitation');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-5 rounded-2xl border border-border bg-white p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <UserPlus size={18} />
        </span>
        <div>
          <h3 className="text-base font-bold text-neutral">Invite a team member</h3>
          <p className="mt-0.5 text-xs text-neutral-variant">
            We’ll email them a secure link to set their password and activate the account.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-neutral-variant transition hover:bg-neutral-soft hover:text-neutral"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Full name"
          placeholder="e.g. Ada Obi"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <TextField
          label="Email address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-neutral">Role</label>
          <SelectMenu value={role} options={ROLE_OPTIONS} onChange={setRole} align="left" />
          <span className="text-xs text-neutral-variant">{ADMIN_ROLE_DESCRIPTIONS[role]}</span>
        </div>
        <CountrySelect label="Country (optional)" value={country} onChange={setCountry} />
      </div>

      {error ? <p className="text-xs font-medium text-error">{error}</p> : null}
      {sentTo ? (
        <p className="text-xs font-medium text-success">Invitation sent to {sentTo}.</p>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Done
        </Button>
        <Button type="submit" loading={isLoading}>
          Send Invitation
        </Button>
      </div>
    </form>
  );
}
