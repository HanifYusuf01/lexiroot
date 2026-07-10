import { useEffect } from 'react';
import { authApi } from '../services/authApi';
import { authStorage, pendingSignupStorage } from '../services/secureStorage';
import { setCredentials, setHydrated, setPendingEmail, setUser } from '../store/slices/authSlice';
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

        // The cached user can be stale — e.g. an admin changed the learner's
        // level/tier after their last login. Refresh from /auth/me so Home
        // queries lessons for the right tier. Network failures keep the cached
        // value (we stay usable offline).
        try {
          const fresh = await dispatch(
            authApi.endpoints.me.initiate(undefined, { forceRefetch: true }),
          ).unwrap();
          if (cancelled) return;
          // Entitlement is the hardest thing to debug from the UI — a padlock
          // looks the same whether the plan is wrong, the cache is stale, or the
          // request failed. Print what the server actually granted.
          if (__DEV__) console.log('[auth/me] features:', JSON.stringify(fresh.features));
          const merged = {
            ...user,
            ...fresh,
            country: fresh.country ?? null,
            avatarUrl: fresh.avatarUrl ?? null,
          };
          dispatch(setUser(merged));
          await authStorage.set({ token: stored.token, user: merged });
        } catch {
          // offline or transient error — keep the rehydrated cached user
        }
      } else if (pending) {
        dispatch(setPendingEmail(pending));
      }
      if (!cancelled) dispatch(setHydrated());
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
}
