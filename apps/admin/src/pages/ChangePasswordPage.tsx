import { FormEvent, useState } from 'react';
import { User } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { PasswordField } from '../components/ui/PasswordField';
import { SectionCard } from '../components/ui/SectionCard';
import { PasswordStrengthMeter } from '../components/features/account/PasswordStrengthMeter';
import { useChangePasswordMutation } from '../services/authApi';
import { evaluatePassword } from '../utils/password';

export function ChangePasswordPage() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState(false);
  const [changePassword, { isLoading: saving }] = useChangePasswordMutation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!current) return setError('Enter your current password');
    if (evaluatePassword(next).score < 3) {
      return setError('Password does not meet the requirements');
    }
    if (next !== confirm) return setError('Passwords do not match');
    setError(undefined);
    setSuccess(false);
    try {
      await changePassword({ currentPassword: current, newPassword: next }).unwrap();
      setCurrent('');
      setNext('');
      setConfirm('');
      setSuccess(true);
    } catch (err) {
      const e2 = err as { status?: number; data?: { message?: string | string[] } };
      if (e2.status === 401) {
        setError('Current password is incorrect');
      } else {
        const msg = e2.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Could not change password');
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Change Password"
        subtitle="Update your Password to keep your account secure."
      />

      <form onSubmit={handleSubmit}>
        <SectionCard
          icon={<User size={18} />}
          title="Password Details"
          subtitle="Update your personal information and contact details"
        >
          <div className="space-y-5">
            <PasswordField
              label="Current Password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Enter your current password"
              autoComplete="current-password"
            />
            <PasswordField
              label="New Password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Enter your new password"
              autoComplete="new-password"
            />
            <PasswordStrengthMeter value={next} />
            <PasswordField
              label="Confirm New Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm your new password"
              autoComplete="new-password"
            />
            {error ? <p className="text-xs font-medium text-error">{error}</p> : null}
            {success ? (
              <p className="text-xs font-semibold text-success">Password updated.</p>
            ) : null}
            <div>
              <Button type="submit" loading={saving}>
                Apply Now
              </Button>
            </div>
          </div>
        </SectionCard>
      </form>
    </div>
  );
}
