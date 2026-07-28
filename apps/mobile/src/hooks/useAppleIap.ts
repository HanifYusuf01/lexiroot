import { useCallback, useRef } from 'react';
import { ErrorCode, useIAP, type Purchase } from 'expo-iap';

export class AppleIapCancelledError extends Error {}

/**
 * Drives a single StoreKit subscription purchase via expo-iap. `purchase(sku,
 * appAccountToken)` resolves with the resulting `Purchase` once StoreKit hands
 * one back, or rejects (with `AppleIapCancelledError` on a user cancel).
 *
 * The caller must verify the transaction server-side and only then call
 * `finishTransaction` — Apple requires every transaction to be finished
 * eventually, but finishing early (before the purchase is durably recorded)
 * risks losing it silently, since a finished transaction is never redelivered.
 */
export function useAppleIap() {
  const pendingRef = useRef<{
    resolve: (purchase: Purchase) => void;
    reject: (error: Error) => void;
  } | null>(null);

  const { connected, requestPurchase, finishTransaction } = useIAP({
    onPurchaseSuccess: (purchase) => {
      pendingRef.current?.resolve(purchase);
      pendingRef.current = null;
    },
    onPurchaseError: (error) => {
      pendingRef.current?.reject(
        error.code === ErrorCode.UserCancelled
          ? new AppleIapCancelledError(error.message)
          : new Error(error.message),
      );
      pendingRef.current = null;
    },
  });

  const purchase = useCallback(
    (sku: string, appAccountToken: string): Promise<Purchase> => {
      return new Promise((resolve, reject) => {
        pendingRef.current = { resolve, reject };
        requestPurchase({
          type: 'subs',
          request: { apple: { sku, appAccountToken } },
        }).catch((err: unknown) => {
          pendingRef.current = null;
          reject(err instanceof Error ? err : new Error('Apple purchase request failed'));
        });
      });
    },
    [requestPurchase],
  );

  return { connected, purchase, finishTransaction };
}
