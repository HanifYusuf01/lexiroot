import type { AppDispatch } from '../store';
import { setUser } from '../store/slices/authSlice';
import { authApi } from './authApi';
import { authStorage } from './secureStorage';

/**
 * Re-fetch `/auth/me` and merge it into the auth slice + secure storage. Used
 * after an entitlement change (subscribe/cancel) so `features` — and thus
 * gating via useEntitlements — reflect the new subscription immediately. Mirrors
 * the merge logic in useAuthBootstrap.
 */
export async function refreshAuthUser(dispatch: AppDispatch): Promise<void> {
  const stored = await authStorage.get();
  if (!stored) return;
  const fresh = await dispatch(
    authApi.endpoints.me.initiate(undefined, { forceRefetch: true }),
  ).unwrap();
  const merged = {
    ...stored.user,
    ...fresh,
    country: fresh.country ?? null,
    avatarUrl: fresh.avatarUrl ?? null,
  };
  dispatch(setUser(merged));
  await authStorage.set({ token: stored.token, user: merged });
}
