import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NOTIFICATION_CHANNELS,
  type NotificationData,
  type PushPlatform,
  type RegisterDeviceBody,
} from '@lexiroot/shared';
import { colors } from '../constants/theme';

const INSTALLATION_ID_KEY = 'lexiroot.installationId';
/** Fixed id so re-scheduling replaces the existing daily reminder in place. */
const DAILY_REMINDER_ID = 'daily-study-reminder';

/**
 * Deep-link route prefixes we're willing to navigate to from a notification
 * tap. Anything outside this allowlist is ignored — a push payload is
 * untrusted input, so we never hand an arbitrary path to the router.
 */
const ALLOWED_ROUTE_PREFIXES = [
  '/(tabs)',
  '/achievements',
  '/culture',
  '/levels',
  '/lessons',
  '/practice',
  '/leaderboard',
];

/** Foreground presentation: show the banner + play sound even while in-app. */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Create the Android notification channels. No-op on iOS (which has no channel
 * concept). Safe to call repeatedly — creating an existing channel just updates
 * it. Channel ids mirror the shared NOTIFICATION_CHANNELS constants.
 */
export async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const common = {
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: colors.primary,
  };
  await Promise.all([
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.reminders, {
      name: 'Reminders',
      ...common,
    }),
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.achievements, {
      name: 'Achievements',
      ...common,
    }),
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.content, {
      name: 'New content',
      ...common,
    }),
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.account, {
      name: 'Account',
      ...common,
    }),
  ]);
}

/** True once the OS notification permission is granted. */
export async function hasPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Request the OS notification permission. Call this only when the learner
 * enables a notification setting — never eagerly at launch (Android 13+ hides
 * notifications until this runtime grant).
 */
export async function requestPermission(): Promise<boolean> {
  if (await hasPermission()) return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Stable per-install id, generated once and persisted. Survives token rotation. */
async function getInstallationId(): Promise<string> {
  const existing = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (existing) return existing;
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(INSTALLATION_ID_KEY, id);
  return id;
}

function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
  } catch {
    return 'en';
  }
}

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Fetch the Expo push token and assemble the registration payload. Returns null
 * when push isn't available (simulator, Expo Go, permission not granted, or any
 * SDK error) so callers degrade gracefully — local reminders still work.
 */
export async function getPushRegistration(): Promise<RegisterDeviceBody | null> {
  if (!Device.isDevice) return null;
  if (!(await hasPermission())) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  if (!projectId) return null;

  try {
    const { data: expoToken } = await Notifications.getExpoPushTokenAsync({ projectId });
    return {
      installationId: await getInstallationId(),
      expoToken,
      platform: Platform.OS as PushPlatform,
      timezone: deviceTimezone(),
      locale: deviceLocale(),
      appVersion: Constants.expoConfig?.version ?? undefined,
    };
  } catch {
    // Expo Go on modern SDKs throws here — that's expected, not an error worth
    // surfacing. A development build is required for remote push.
    return null;
  }
}

/** The installation id to send when unregistering (matches what we registered). */
export function currentInstallationId(): Promise<string> {
  return getInstallationId();
}

/**
 * Schedule (or reschedule) the local daily study reminder at `hhmm` (24-hour,
 * device-local). Local scheduling means it fires without connectivity and
 * naturally follows the device's timezone.
 */
export async function scheduleDailyReminder(hhmm: string): Promise<void> {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return;
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'Time to practise! 🦜',
      body: 'A few minutes a day keeps your streak alive.',
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNELS.reminders } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: Number(m[1]),
      minute: Number(m[2]),
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => undefined);
}

/** Validate a deep-link route from a push payload against the allowlist. */
export function isAllowedRoute(route: string | undefined): route is string {
  if (!route || !route.startsWith('/')) return false;
  return ALLOWED_ROUTE_PREFIXES.some(
    (prefix) => route === prefix || route.startsWith(`${prefix}/`),
  );
}

/** Extract a validated route from a notification response, if any. */
export function routeFromResponse(response: Notifications.NotificationResponse): string | null {
  const data = response.notification.request.content.data as Partial<NotificationData> | undefined;
  return isAllowedRoute(data?.route) ? data.route : null;
}
