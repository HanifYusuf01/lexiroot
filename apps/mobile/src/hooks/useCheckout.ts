import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { ClientPlatform } from '@lexiroot/shared';
import { refreshAuthUser } from '../services/refreshAuthUser';
import { describeApiError } from '../utils/apiError';
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

// The server routes to a payment provider partly off the platform (iOS must bill
// through Apple IAP). Platform.OS is wider than the platforms the API knows about,
// so anything exotic falls back to `web` (card checkout).
const CLIENT_PLATFORM: ClientPlatform =
  Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';

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
        // No `provider` — the server resolves it from platform + the user's country.
        const session = await createCheckout({
          planId,
          platform: CLIENT_PLATFORM,
          returnDeepLink: returnUrl,
        }).unwrap();
        if (!session.url) {
          // A provider that returns a clientSecret instead of a hosted URL isn't
          // supported by this flow yet — surface it rather than failing blankly.
          if (__DEV__) console.error('[checkout] no hosted-checkout URL in session', session);
          return 'error';
        }

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
      } catch (err) {
        // The server's reason (unsynced plan price, unavailable provider, a
        // rejected field) is the only thing that explains a failed checkout —
        // swallowing it silently turns every cause into the same dead end.
        if (__DEV__) console.error('[checkout] failed —', describeApiError(err));
        return 'error';
      } finally {
        setBusy(false);
      }
    },
    [createCheckout, pollEntitled, dispatch],
  );

  return { start, busy };
}
