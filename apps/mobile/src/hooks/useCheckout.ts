import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { ClientPlatform, CreateCheckoutResponse } from '@lexiroot/shared';
import { refreshAuthUser } from '../services/refreshAuthUser';
import { apiErrorStatus, describeApiError } from '../utils/apiError';
import {
  useCreateCheckoutMutation,
  useLazyMySubscriptionQuery,
  useVerifyAppleTransactionMutation,
} from '../services/subscriptionsApi';
import { useAppDispatch } from '../store/hooks';
import { AppleIapCancelledError, useAppleIap } from './useAppleIap';

export type CheckoutOutcome =
  | 'success'
  | 'already_subscribed'
  | 'cancelled'
  | 'pending'
  | 'error';

export type RestoreOutcome = 'restored' | 'nothing_to_restore' | 'error';

/** The API rejects a second checkout while a live subscription exists. */
const HTTP_CONFLICT = 409;

// Poll window after checkout: the webhook that flips us to ACTIVE usually lands
// within a few seconds, but give it room before falling back to "pending".
const POLL_ATTEMPTS = 12;
const POLL_INTERVAL_MS = 1500;
// A manual close is almost always a cancel, but could be a completed payment
// whose return-bounce failed. Do a brief check instead of the full poll so a
// genuine cancel doesn't sit on "processing" for the whole window.
const CANCEL_CHECK_ATTEMPTS = 2;

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
  const [verifyAppleTransaction] = useVerifyAppleTransactionMutation();
  const appleIap = useAppleIap();
  const [busy, setBusy] = useState(false);

  const pollEntitled = useCallback(async (attempts = POLL_ATTEMPTS): Promise<boolean> => {
    for (let i = 0; i < attempts; i += 1) {
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

  /**
   * Apple IAP has no hosted session — purchase natively via StoreKit, verify
   * the resulting transaction server-side (the only path that links the
   * *first* purchase; ASSN v2 webhooks keep it in sync afterwards), then finish
   * the transaction so StoreKit stops redelivering it.
   */
  const purchaseViaAppleIap = useCallback(
    async (session: CreateCheckoutResponse): Promise<CheckoutOutcome> => {
      if (!session.providerProductId) {
        if (__DEV__) console.error('[checkout] apple_iap session has no providerProductId', session);
        return 'error';
      }
      try {
        const purchase = await appleIap.purchase(
          session.providerProductId,
          session.appAccountToken ?? '',
        );
        const transactionId = 'transactionId' in purchase ? purchase.transactionId : null;
        if (!transactionId) throw new Error('Apple purchase did not return a transaction id');

        const result = await verifyAppleTransaction({ transactionId }).unwrap();
        // Only finish the transaction once it's durably recorded on our side —
        // finishing early risks losing it silently on a crash mid-verify, since
        // StoreKit never redelivers a finished transaction.
        await appleIap.finishTransaction({ purchase });
        await refreshAuthUser(dispatch);
        return result.entitled ? 'success' : 'pending';
      } catch (err) {
        if (err instanceof AppleIapCancelledError) return 'cancelled';
        if (__DEV__) console.error('[checkout] apple_iap purchase failed —', describeApiError(err));
        return 'error';
      }
    },
    [appleIap, dispatch, verifyAppleTransaction],
  );

  /**
   * Recover access the learner has already paid for (App Review Guideline
   * 3.1.1 requires this to exist).
   *
   * On iOS it replays StoreKit's own record of what the Apple Account owns and
   * re-links each transaction server-side. That is the only way back from a
   * purchase that completed at Apple but never reached `/apple-iap/verify` — a
   * crash or dropped connection mid-verify leaves the learner charged with no
   * entitlement, and StoreKit never redelivers a finished transaction.
   *
   * Elsewhere there is no store receipt to replay: card subscriptions are tied
   * to the account server-side, so restoring is just a resync.
   */
  const restore = useCallback(async (): Promise<RestoreOutcome> => {
    setBusy(true);
    try {
      if (CLIENT_PLATFORM !== 'ios') {
        const data = await fetchMySubscription(undefined, false).unwrap();
        if (!data.entitled) return 'nothing_to_restore';
        await refreshAuthUser(dispatch);
        return 'restored';
      }

      const purchases = await appleIap.restore();
      let entitled = false;

      for (const purchase of purchases) {
        const transactionId = 'transactionId' in purchase ? purchase.transactionId : null;
        if (!transactionId) continue;
        try {
          const result = await verifyAppleTransaction({ transactionId }).unwrap();
          // Safe to finish now that it's durably linked. An already-finished
          // transaction must not fail the restore, hence the swallowed catch.
          await appleIap.finishTransaction({ purchase }).catch(() => undefined);
          if (result.entitled) {
            entitled = true;
            break;
          }
        } catch (err) {
          // One stale transaction shouldn't abandon the rest — an Apple Account
          // can hold transactions from expired or superseded subscriptions.
          if (__DEV__) console.error('[restore] verify failed —', describeApiError(err));
        }
      }

      if (!entitled) return 'nothing_to_restore';
      await refreshAuthUser(dispatch);
      return 'restored';
    } catch (err) {
      if (__DEV__) console.error('[restore] failed —', describeApiError(err));
      return 'error';
    } finally {
      setBusy(false);
    }
  }, [appleIap, dispatch, fetchMySubscription, verifyAppleTransaction]);

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

        if (session.provider === 'apple_iap') {
          return await purchaseViaAppleIap(session);
        }

        if (!session.url) {
          // A provider that returns a clientSecret instead of a hosted URL isn't
          // supported by this flow yet — surface it rather than failing blankly.
          if (__DEV__) console.error('[checkout] no hosted-checkout URL in session', session);
          return 'error';
        }

        // Opens an ephemeral in-app browser that auto-closes when the checkout
        // redirects back to returnUrl.
        const result = await WebBrowser.openAuthSessionAsync(session.url, returnUrl);

        if (result.type === 'success') {
          // Returned via the deep link → a payment almost certainly completed.
          // The webhook is the source of truth, so poll until entitlement flips.
          if (await pollEntitled()) {
            await refreshAuthUser(dispatch);
            return 'success';
          }
          return 'pending';
        }

        // The learner closed the browser (Cancel Payment / the X) without being
        // redirected back. Treat it as a cancel, but do a brief entitlement check
        // first to catch a paid checkout whose return-bounce failed.
        if (await pollEntitled(CANCEL_CHECK_ATTEMPTS)) {
          await refreshAuthUser(dispatch);
          return 'success';
        }
        return 'cancelled';
      } catch (err) {
        // The server's reason (unsynced plan price, unavailable provider, a
        // rejected field) is the only thing that explains a failed checkout —
        // swallowing it silently turns every cause into the same dead end.
        if (__DEV__) console.error('[checkout] failed —', describeApiError(err));

        // 409 isn't a failure: the learner already has a live subscription, so
        // the server refused to open a second one. The app's cached user is just
        // behind — resync it rather than showing them an error for having paid.
        if (apiErrorStatus(err) === HTTP_CONFLICT) {
          try {
            await refreshAuthUser(dispatch);
          } catch {
            // Non-fatal: they're still subscribed; the next launch will resync.
          }
          return 'already_subscribed';
        }
        return 'error';
      } finally {
        setBusy(false);
      }
    },
    [createCheckout, pollEntitled, dispatch, purchaseViaAppleIap],
  );

  return { start, restore, busy };
}
