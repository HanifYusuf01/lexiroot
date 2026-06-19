import NetInfo from '@react-native-community/netinfo';
import type { AppDispatch, RootState } from '../store';
import { selectIsOnline, setNetworkState } from '../store/slices/networkSlice';

let unsubscribe: (() => void) | null = null;

interface MonitorDeps {
  dispatch: AppDispatch;
  getState: () => RootState;
  /** Invoked on every offline → online transition (e.g. to flush the outbox). */
  onReconnect?: () => void;
}

/**
 * Subscribes to NetInfo and mirrors connectivity into the `network` slice.
 * Idempotent — calling it twice keeps a single subscription. The reconnect
 * callback fires only on a genuine offline → online edge, never on the first
 * event, so a cold start that begins online doesn't trigger a spurious flush.
 */
export function startConnectivityMonitor({ dispatch, getState, onReconnect }: MonitorDeps): void {
  if (unsubscribe) return;
  let wasOnline = selectIsOnline(getState());
  unsubscribe = NetInfo.addEventListener((state) => {
    dispatch(
      setNetworkState({
        isConnected: !!state.isConnected,
        isInternetReachable: state.isInternetReachable,
      }),
    );
    const isOnline = selectIsOnline(getState());
    if (isOnline && !wasOnline) onReconnect?.();
    wasOnline = isOnline;
  });
}

export function stopConnectivityMonitor(): void {
  unsubscribe?.();
  unsubscribe = null;
}
