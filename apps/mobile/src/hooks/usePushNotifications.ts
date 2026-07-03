import { useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAppSelector } from '../store/hooks';
import { useRegisterDeviceMutation } from '../services/devicesApi';
import {
  configureNotificationHandler,
  ensureAndroidChannels,
  getPushRegistration,
  hasPermission,
  requestPermission,
  routeFromResponse,
} from '../services/notifications';

// Configure foreground behaviour once at module load, before any component
// mounts, so notifications received during the first render are handled.
configureNotificationHandler();

/**
 * App-level push bootstrap. Mounted once near the root. Sets up channels,
 * routes notification taps, and — for users who already granted permission —
 * silently refreshes their device registration on launch (new token, changed
 * timezone). It never *requests* permission; that's opt-in via settings.
 */
export function usePushNotificationsBootstrap(): void {
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.token);
  const [registerDevice] = useRegisterDeviceMutation();

  // Android channels are independent of auth/permission — safe to create early.
  useEffect(() => {
    void ensureAndroidChannels();
  }, []);

  // Navigate when a notification is tapped, including the cold-start case where
  // the tap launched the app.
  useEffect(() => {
    let mounted = true;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!mounted || !response) return;
      const route = routeFromResponse(response);
      if (route) router.push(route as never);
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = routeFromResponse(response);
      if (route) router.push(route as never);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [router]);

  // Refresh registration on login for users who previously opted in. Guarded by
  // hasPermission so we never prompt here.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      if (!(await hasPermission())) return;
      const registration = await getPushRegistration();
      if (!cancelled && registration) {
        await registerDevice(registration).unwrap().catch(() => undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, registerDevice]);
}

/**
 * Returns an `enable` callback for the settings screen: requests OS permission
 * (if needed) and registers the device. Resolves to whether push is now active
 * so the UI can react (e.g. revert a toggle if the user denied permission).
 */
export function useEnablePushNotifications(): { enable: () => Promise<boolean> } {
  const [registerDevice] = useRegisterDeviceMutation();

  const enable = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return false;
    await ensureAndroidChannels();
    const registration = await getPushRegistration();
    if (registration) {
      await registerDevice(registration).unwrap().catch(() => undefined);
    }
    // Permission is granted even if token fetch failed (e.g. Expo Go): local
    // reminders still work, so treat this as enabled.
    return true;
  }, [registerDevice]);

  return { enable };
}
