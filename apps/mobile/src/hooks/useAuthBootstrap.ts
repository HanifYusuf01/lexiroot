import { useEffect } from 'react';
import { authStorage, pendingSignupStorage } from '../services/secureStorage';
import { setCredentials, setHydrated, setPendingEmail } from '../store/slices/authSlice';
import { useAppDispatch } from '../store/hooks';

export function useAuthBootstrap(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stored, pending] = await Promise.all([
        authStorage.get(),
        pendingSignupStorage.get(),
      ]);
      if (cancelled) return;
      if (stored) {
        const user = {
          ...stored.user,
          country: stored.user.country ?? null,
          avatarUrl: stored.user.avatarUrl ?? null,
        };
        dispatch(setCredentials({ token: stored.token, user }));
      } else if (pending) {
        dispatch(setPendingEmail(pending));
      }
      dispatch(setHydrated());
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
}
