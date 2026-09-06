import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { pendingInviteStorage } from '../services/secureStorage';
import { useAppSelector } from '../store/hooks';

/**
 * Reopens an invitation the person parked before signing in.
 *
 * Accepting needs an account, and the route to one is long — sign in, or sign
 * up, verify an email, finish onboarding. Every one of those screens used to
 * end at Home, so an invitation opened by someone without an account was simply
 * lost: nothing carried the token, and nothing in the app referred to it again.
 *
 * Watching the session instead of threading a parameter through five screens
 * means it resumes from whichever path they actually took.
 */
export function useResumePendingInvite(): void {
  const token = useAppSelector((s) => s.auth.token);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  // Once per session: reopening on every auth-state change would fight the
  // learner's own navigation.
  const resumed = useRef(false);

  useEffect(() => {
    if (!hydrated || !token || resumed.current) return;
    resumed.current = true;

    (async () => {
      const pending = await pendingInviteStorage.get();
      if (!pending) return;
      // Cleared before navigating, not after: a crash on the invite screen
      // must not trap them in a loop back to it on every launch.
      await pendingInviteStorage.clear();
      router.push({
        pathname: pending.kind === 'friend' ? '/friend-invite' : '/family-invite',
        params: { token: pending.token },
      });
    })();
  }, [hydrated, token]);
}
