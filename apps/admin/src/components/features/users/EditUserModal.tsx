import { FormEvent, useEffect, useState } from 'react';
import { Flame, RotateCcw } from 'lucide-react';
import {
  LANGUAGE_CODES,
  LANGUAGE_LABELS,
  LEARNING_LEVELS,
  LEARNING_LEVEL_LABELS,
  type LanguageCode,
  type LearningLevel,
} from '@lexiroot/shared';
import { Modal } from '../../ui/Modal';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { UserRow, useUpdateUserMutation } from '../../../services/usersApi';
import { formatDate, formatNumber } from '../../../utils/format';

interface Props {
  user: UserRow | null;
  onClose: () => void;
}

export function EditUserModal({ user, onClose }: Props) {
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [emailVerified, setEmailVerified] = useState(false);
  const [language, setLanguage] = useState<LanguageCode | ''>('');
  const [level, setLevel] = useState<LearningLevel | ''>('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setRole(user.role);
      setEmailVerified(!!user.emailVerifiedAt);
      setLanguage(user.language ?? '');
      setLevel(user.level ?? '');
    }
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      await updateUser({
        id: user.id,
        displayName,
        role,
        emailVerified,
        language: language || undefined,
        level: level || undefined,
      }).unwrap();
      onClose();
    } catch {
      /* error stays in mutation state; submit again to retry */
    }
  }

  return (
    <Modal open={!!user} onClose={onClose} size="xl">
      {user ? (
        <form onSubmit={handleSubmit}>
          <h2 className="font-display text-lg font-bold text-neutral">Edit User</h2>

          <div className="mt-5 flex items-start gap-4 rounded-2xl border border-border p-4">
            <Avatar name={user.displayName} size={72} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-neutral">{user.displayName}</span>
                {user.isActive ? (
                  <Badge tone="success">Active</Badge>
                ) : (
                  <Badge tone="error">Inactive</Badge>
                )}
              </div>
              <div className="mt-1 text-sm text-neutral-variant">
                Mail: <span className="text-neutral">{user.email}</span>
              </div>
              <div className="text-sm text-neutral-variant">
                Language: {language ? LANGUAGE_LABELS[language] : '—'}
              </div>
              <div className="text-sm text-neutral-variant">
                Date Joined: {formatDate(user.createdAt)}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-border p-4">
              <h3 className="text-sm font-bold text-neutral">Account</h3>
              <div className="mt-3 space-y-3">
                <Field label="Display Name">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Email Verified">
                  <select
                    value={emailVerified ? 'yes' : 'no'}
                    onChange={(e) => setEmailVerified(e.target.value === 'yes')}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </Field>
                <Field label="Role">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>
                <Field label="Email">
                  <div className="flex items-center gap-3">
                    {emailVerified ? (
                      <Badge tone="success">Verified</Badge>
                    ) : (
                      <Badge tone="error">Unverified</Badge>
                    )}
                    <button
                      type="button"
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Resend Email
                    </button>
                  </div>
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border border-border p-4">
              <h3 className="text-sm font-bold text-neutral">Learning Progress</h3>
              <div className="mt-3 space-y-3">
                <Field label="Language">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageCode | '')}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">—</option>
                    {LANGUAGE_CODES.map((code) => (
                      <option key={code} value={code}>
                        {LANGUAGE_LABELS[code]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Current Level">
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as LearningLevel | '')}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">—</option>
                    {LEARNING_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {LEARNING_LEVEL_LABELS[lvl]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Total XP">
                  <input
                    type="text"
                    value={formatNumber(user.xp)}
                    disabled
                    className="w-full rounded-lg border border-border bg-neutral-soft px-3 py-2 text-sm text-neutral-variant"
                  />
                </Field>
                <Field label="Current Streak (days)">
                  <input
                    type="text"
                    value={String(user.currentStreakDays)}
                    disabled
                    className="w-full rounded-lg border border-border bg-neutral-soft px-3 py-2 text-sm text-neutral-variant"
                  />
                </Field>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-semibold text-success"
                  >
                    <Flame size={14} /> Restore Streak
                  </button>
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs font-semibold text-error"
                  >
                    <RotateCcw size={14} /> Reset Progress
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm text-neutral-variant">{label}</span>
      <div className="w-56 shrink-0">{children}</div>
    </label>
  );
}
