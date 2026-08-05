import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { TextField } from '../components/ui/TextField';
import { PasswordField } from '../components/ui/PasswordField';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useResetPasswordMutation } from '../services/authApi';
import { apiErrorMessage } from '../utils/apiError';
import { PASSWORD_RULES } from '../utils/password';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const email = (params.get('email') ?? '').trim().toLowerCase();

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [codeError, setCodeError] = useState<string | undefined>(undefined);

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password],
  );
  const passwordValid = ruleResults.every((r) => r.passed);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    setCodeError(undefined);

    if (!email) {
      setError('Missing email. Please request a new reset code.');
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setCodeError('Enter the 6-digit code from your email');
      return;
    }
    if (!passwordValid) {
      setError('Please choose a password that meets all the requirements.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await resetPassword({ email, code: code.trim(), newPassword: password }).unwrap();
      toast.success('Password updated. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setCodeError(apiErrorMessage(err, 'This reset code is invalid or has expired. Request a new one.'));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-soft px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl font-extrabold text-primary text-center">
          Create a new password
        </h1>
        <p className="mt-1 text-center text-sm text-neutral-variant">
          Enter the 6-digit code we sent{email ? ` to ${email}` : ''} and choose a new password.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <TextField
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={codeError}
            inputMode="numeric"
            maxLength={6}
            autoFocus
          />
          <PasswordField
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <ul className="-mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {ruleResults.map((rule) => (
              <li
                key={rule.key}
                className={`flex items-center gap-1.5 text-xs ${
                  rule.passed ? 'text-success' : 'text-neutral-variant'
                }`}
              >
                {rule.passed ? <Check size={13} /> : <X size={13} />}
                {rule.label}
              </li>
            ))}
          </ul>

          <PasswordField
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            error={confirm.length > 0 && confirm !== password ? 'Passwords do not match' : undefined}
          />

          {error ? <p className="text-xs font-medium text-error">{error}</p> : null}

          <Button type="submit" loading={isLoading} disabled={!passwordValid || password !== confirm}>
            Update password
          </Button>
        </form>
        <Link
          to="/forgot-password"
          className="mt-6 block text-center text-sm font-bold text-primary hover:underline"
        >
          Didn&apos;t get a code? Request a new one
        </Link>
      </div>
    </div>
  );
}
