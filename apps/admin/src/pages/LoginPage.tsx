import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PasswordField } from '../components/ui/PasswordField';
import { TextField } from '../components/ui/TextField';
import { useLoginMutation } from '../services/authApi';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import { adminAuthStorage } from '../utils/storage';

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();
      if (result.user.role !== 'admin') {
        setError('This account does not have admin access.');
        return;
      }
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
      const e = err as { status?: number };
      setError(e.status === 401 ? 'Invalid email or password' : 'Something went wrong.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-soft px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl font-extrabold text-primary text-center">
          Welcome Back
        </h1>
        <p className="mt-1 text-center text-sm text-neutral-variant">Admin sign-in to LexiRoot.</p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <TextField
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            autoFocus
          />
          <PasswordField
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Button type="submit" loading={isLoading}>
            Log in
          </Button>
        </form>
      </div>
    </div>
  );
}
