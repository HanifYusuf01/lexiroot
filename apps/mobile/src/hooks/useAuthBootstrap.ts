import { useEffect } from 'react';
import { authStorage } from '../services/secureStorage';
import { setCredentials, setHydrated } from '../store/slices/authSlice';
import { useAppDispatch } from '../store/hooks';

export function useAuthBootstrap(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await authStorage.get();
      if (cancelled) return;
      if (stored) {
        // Normalize older stored sessions that predate country/phone fields.
        const user = {
          ...stored.user,
          country: stored.user.country ?? null,
          phone: stored.user.phone ?? null,
          avatarUrl: stored.user.avatarUrl ?? null,
        };
        dispatch(setCredentials({ token: stored.token, user }));
      }
      dispatch(setHydrated());
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
}
