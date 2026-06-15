import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ShieldCheck, Sparkles, X } from 'lucide-react';
import { ADMIN_ROLE_DESCRIPTIONS, ADMIN_ROLE_LABELS } from '@lexiroot/shared';
import { Button } from '../components/ui/Button';
import { PasswordField } from '../components/ui/PasswordField';
import { TextField } from '../components/ui/TextField';
import { LexiRootLogo } from '../components/icons/LexiRootLogo';
import {
  useAcceptInvitationMutation,
  useInvitationPreviewQuery,
} from '../services/adminsApi';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import { adminAuthStorage } from '../utils/storage';
import { PASSWORD_RULES } from '../utils/password';

const TAGLINE = 'Your language. Your roots.';

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
      <div aria-hidden className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
      <div aria-hidden className="absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-black/10" />

      <div className="relative flex items-center gap-3">
        <LexiRootLogo size={40} className="text-primary-foreground" />
        <span className="font-display text-3xl font-extrabold">LexiRoot</span>
      </div>

      <div className="relative max-w-sm">
        <p className="font-display text-4xl font-extrabold leading-tight">{TAGLINE}</p>
        <p className="mt-4 text-sm text-primary-foreground/80">
          You&apos;ve been invited to help build a multi-generational platform for learning
          African languages and cultures.
        </p>

        <ul className="mt-8 flex flex-col gap-4 text-sm">
          <li className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Sparkles size={16} />
            </span>
            Craft gamified, audio-first lessons
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <ShieldCheck size={16} />
            </span>
            Secure, role-based dashboard access
          </li>
        </ul>
      </div>

      <p className="relative text-xs text-primary-foreground/70">
        © {new Date().getFullYear()} LexiRoot. All rights reserved.
      </p>
    </div>
  );
}

function StateMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
      <BrandPanel />
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <h2 className="font-display text-2xl font-extrabold text-neutral">{title}</h2>
          <p className="mt-2 text-sm text-neutral-variant">{message}</p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm font-bold text-primary hover:underline"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: preview, isLoading, isError } = useInvitationPreviewQuery(token, {
    skip: !token,
  });
  const [accept, { isLoading: submitting }] = useAcceptInvitationMutation();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>();

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password],
  );
  const passwordValid = ruleResults.every((r) => r.passed);

  if (!token) {
    return (
      <StateMessage
        title="Invalid invitation"
        message="This registration link is missing its token. Please use the link from your invitation email."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-soft">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !preview) {
    return (
      <StateMessage
        title="Invitation not found"
        message="We couldn't find this invitation. It may have been revoked. Ask an admin to send a new one."
      />
    );
  }

  if (preview.status === 'accepted') {
    return (
      <StateMessage
        title="Already activated"
        message="This invitation has already been used. You can sign in with your email and password."
      />
    );
  }

  if (preview.status === 'expired') {
    return (
      <StateMessage
        title="Invitation expired"
        message="This invitation has expired. Ask an admin to send you a fresh invitation link."
      />
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    if (!passwordValid) {
      setError('Please choose a password that meets all the requirements.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const result = await accept({ token, password }).unwrap();
      const stored = {
        token: result.token,
        user: {
          ...result.user,
          emailVerifiedAt: result.user.emailVerifiedAt ?? null,
          country: result.user.country ?? null,
        },
      };
      adminAuthStorage.set(stored);
      dispatch(setCredentials(stored));
      navigate('/', { replace: true });
    } catch (err) {
      const e = err as { data?: { message?: string | string[] } };
      const message = Array.isArray(e.data?.message) ? e.data?.message[0] : e.data?.message;
      setError(message ?? 'Could not complete registration. Please try again.');
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <LexiRootLogo size={32} className="text-primary" />
            <span className="font-display text-2xl font-extrabold text-neutral">LexiRoot</span>
          </div>

          <h2 className="font-display text-3xl font-extrabold text-neutral">Set up your account</h2>
          <p className="mt-1 text-sm text-neutral-variant">
            Welcome, {preview.displayName.split(' ')[0]}. Create a password to activate your{' '}
            <span className="font-semibold text-neutral">{ADMIN_ROLE_LABELS[preview.role]}</span>{' '}
            account.
          </p>

          <div className="mt-4 rounded-xl border border-border bg-neutral-soft/50 p-3 text-xs text-neutral-variant">
            {ADMIN_ROLE_DESCRIPTIONS[preview.role]}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <TextField
              label="Full name"
              value={preview.displayName}
              disabled
              className="bg-neutral-soft text-neutral-variant"
            />
            <TextField
              label="Email"
              value={preview.email}
              disabled
              className="bg-neutral-soft text-neutral-variant"
            />
            <PasswordField
              label="Password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
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
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              error={
                confirm.length > 0 && confirm !== password ? 'Passwords do not match' : undefined
              }
            />

            {error ? <p className="text-xs font-medium text-error">{error}</p> : null}

            <Button
              type="submit"
              loading={submitting}
              disabled={!passwordValid || password !== confirm}
            >
              Create account &amp; sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
