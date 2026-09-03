import { useCallback, useState } from 'react';
import type { ChangePlanResponse } from '@lexiroot/shared';
import { refreshAuthUser } from '../services/refreshAuthUser';
import { apiErrorMessage, describeApiError } from '../utils/apiError';
import {
  useChangePlanMutation,
  useVerifyAppleTransactionMutation,
} from '../services/subscriptionsApi';
import { useAppDispatch } from '../store/hooks';
import { AppleIapCancelledError, transactionIdOf, useAppleIap } from './useAppleIap';
import { CLIENT_PLATFORM } from './useCheckout';

export type PlanChangeOutcome =
  /** Live now — they are on the new plan and have been charged the difference. */
  | { status: 'applied' }
  /** Agreed, takes effect when the period they already paid for runs out. */
  | { status: 'scheduled'; effectiveAt: string | null }
  /** They backed out of the App Store sheet. Nothing changed. */
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

/**
 * Moves an existing subscription between plans (see `POST
 * /subscriptions/change-plan`). Distinct from `useCheckout`, which opens a
 * first subscription and is refused while one is live.
 *
 * The server decides the direction and the timing — the client never guesses at
 * which move is an upgrade, because the answer has to match what the provider
 * will actually bill. All this hook adds is the one step the server can't take:
 * on iOS, Apple requires the subscriber themselves to buy the new product
 * through StoreKit, so a `store` response is finished here rather than being an
 * error.
 */
export function usePlanChange() {
  const dispatch = useAppDispatch();
  const [changePlan] = useChangePlanMutation();
  const [verifyAppleTransaction] = useVerifyAppleTransactionMutation();
  const appleIap = useAppleIap();
  const [busy, setBusy] = useState(false);

  /**
   * Finish an Apple plan change on-device. StoreKit applies the same timing we
   * do for card providers — an upgrade takes effect at once with the unused
   * time prorated, a downgrade waits for the next renewal — so the outcome is
   * read off the direction the server already worked out.
   */
  const changeViaAppleIap = useCallback(
    async (session: ChangePlanResponse): Promise<PlanChangeOutcome> => {
      if (!session.providerProductId) {
        if (__DEV__) console.error('[plan-change] store session has no productId', session);
        return { status: 'error', message: 'That plan is not available on the App Store yet.' };
      }
      try {
        const purchase = await appleIap.purchase(
          session.providerProductId,
          session.appAccountToken ?? '',
        );
        const transactionId = transactionIdOf(purchase);
        if (!transactionId) throw new Error('Apple purchase did not return a transaction id');

        // Same ordering rule as first purchase: verify server-side before
        // finishing, because StoreKit never redelivers a finished transaction.
        await verifyAppleTransaction({ transactionId }).unwrap();
        await appleIap.finishTransaction({ purchase });
        await refreshAuthUser(dispatch);

        return session.direction === 'upgrade'
          ? { status: 'applied' }
          : { status: 'scheduled', effectiveAt: null };
      } catch (err) {
        if (err instanceof AppleIapCancelledError) return { status: 'cancelled' };
        if (__DEV__) console.error('[plan-change] apple purchase failed —', describeApiError(err));
        return { status: 'error', message: apiErrorMessage(err) };
      }
    },
    [appleIap, dispatch, verifyAppleTransaction],
  );

  /**
   * `confirmRemovesSeats` is passed only after the learner has been shown who
   * loses access — the server refuses the change without it, so the flag can
   * never be a default the UI forgot to think about.
   */
  const change = useCallback(
    async (planId: string, confirmRemovesSeats = false): Promise<PlanChangeOutcome> => {
      setBusy(true);
      try {
        const session = await changePlan({
          planId,
          platform: CLIENT_PLATFORM,
          confirmRemovesSeats,
        }).unwrap();
        if (session.mode === 'store') return await changeViaAppleIap(session);

        // The card providers have already been told; our row moved with them.
        await refreshAuthUser(dispatch);
        return session.mode === 'applied'
          ? { status: 'applied' }
          : { status: 'scheduled', effectiveAt: session.effectiveAt };
      } catch (err) {
        // The server's reason ("you are already on that plan", "remove the
        // people on your family plan first") is the only thing that explains a
        // refusal — a generic message would leave the learner stuck.
        if (__DEV__) console.error('[plan-change] failed —', describeApiError(err));
        return { status: 'error', message: apiErrorMessage(err) };
      } finally {
        setBusy(false);
      }
    },
    [changePlan, changeViaAppleIap, dispatch],
  );

  return { change, busy };
}
