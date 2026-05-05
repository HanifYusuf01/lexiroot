import { useEffect } from 'react';
import { adminAuthStorage } from '../utils/storage';
import { setCredentials, setHydrated } from '../store/slices/authSlice';
import { useAppDispatch } from '../store/hooks';

export function useAuthBootstrap(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const stored = adminAuthStorage.get();
    if (stored && stored.user.role === 'admin') {
      // Normalize older stored sessions that predate country/phone fields.
      const user = {
        ...stored.user,
        country: stored.user.country ?? null,
        phone: stored.user.phone ?? null,
      };
      dispatch(setCredentials({ token: stored.token, user }));
    } else if (stored) {
      adminAuthStorage.clear();
    }
    dispatch(setHydrated());
  }, [dispatch]);
}
