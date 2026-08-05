import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { useRequestPasswordResetMutation } from '../services/authApi';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [requestReset, { isLoading }] = useRequestPasswordResetMutation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      setError('Please enter a valid email address');
      return;
    }
    setError(undefined);
    try {
      await requestReset({ email: normalized }).unwrap();
      navigate(`/reset-password?email=${encodeURIComponent(normalized)}`);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-soft px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl font-extrabold text-primary text-center">
          Reset your password
        </h1>
        <p className="mt-1 text-center text-sm text-neutral-variant">
          Enter your email and we&apos;ll send you a 6-digit reset code.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <TextField
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            autoFocus
          />
          <Button type="submit" loading={isLoading}>
            Send reset code
          </Button>
        </form>
        <Link
          to="/login"
          className="mt-6 block text-center text-sm font-bold text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
