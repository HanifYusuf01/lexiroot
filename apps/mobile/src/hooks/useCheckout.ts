import { useCallback, useState } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { refreshAuthUser } from '../services/refreshAuthUser';
import {
  useCreateCheckoutMutation,
  useLazyMySubscriptionQuery,
} from '../services/subscriptionsApi';
import { useAppDispatch } from '../store/hooks';

export type CheckoutOutcome = 'success' | 'cancelled' | 'pending' | 'error';

// Poll window after checkout: the webhook that flips us to ACTIVE usually lands
// within a few seconds, but give it room before falling back to "pending".
const POLL_ATTEMPTS = 12;
const POLL_INTERVAL_MS = 1500;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Drives the hosted-checkout flow (matches the backend): create a checkout
 * session, open it in an auth browser session that returns to the app via deep
 * link, then poll `/subscriptions/me` until entitlement flips (Rule 10a) and
 * refresh the auth user so gating unlocks. Returns the outcome so the caller can
 * navigate (e.g. into the next lesson on success).
 */
export function useCheckout() {
  const dispatch = useAppDispatch();
  const [createCheckout] = useCreateCheckoutMutation();
  const [fetchMySubscription] = useLazyMySubscriptionQuery();
  const [busy, setBusy] = useState(false);

  const pollEntitled = useCallback(async (): Promise<boolean> => {
    for (let i = 0; i < POLL_ATTEMPTS; i += 1) {
      try {
        const data = await fetchMySubscription(undefined, false).unwrap();
        if (data.entitled) return true;
      } catch {
        // transient — keep polling
      }
      await delay(POLL_INTERVAL_MS);
    }
    return false;
  }, [fetchMySubscription]);

  const start = useCallback(
    async (planId: string): Promise<CheckoutOutcome> => {
      setBusy(true);
      try {
        const returnUrl = Linking.createURL('subscription-return');
        const session = await createCheckout({ planId, returnDeepLink: returnUrl }).unwrap();
        if (!session.url) return 'error';

        // Opens an ephemeral in-app browser that auto-closes when the checkout
        // redirects back to returnUrl.
        const result = await WebBrowser.openAuthSessionAsync(session.url, returnUrl);

        // The webhook is the source of truth, not the redirect — always poll.
        const entitled = await pollEntitled();
        if (entitled) {
          await refreshAuthUser(dispatch);
          return 'success';
        }
        if (result.type === 'cancel' || result.type === 'dismiss') return 'cancelled';
        return 'pending';
      } catch {
        return 'error';
      } finally {
        setBusy(false);
      }
    },
    [createCheckout, pollEntitled, dispatch],
  );

  return { start, busy };
}
