/**
 * Push-notification contracts shared across api / mobile.
 *
 * Delivery is a hybrid model: daily study reminders are scheduled *locally*
 * on-device (they follow the device clock and work offline), while
 * server-driven events (achievements, new cultural content, streak warnings)
 * are pushed remotely through Expo Push Service.
 */

/** Device platforms we register push tokens for. */
export const PUSH_PLATFORMS = ['ios', 'android'] as const;
export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

/**
 * Android notification channels. iOS ignores channels but we keep the same
 * ids so a notification's `channelId` is meaningful on both platforms.
 * Each maps loosely to a user-facing settings toggle.
 */
export const NOTIFICATION_CHANNELS = {
  reminders: 'reminders',
  achievements: 'achievements',
  content: 'content',
  account: 'account',
} as const;
export type NotificationChannelId =
  (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

/**
 * Server-driven notification types. `daily_reminder` is intentionally absent —
 * that one is scheduled locally on the device, never sent from the server.
 */
export const NOTIFICATION_TYPES = [
  'achievement_unlocked',
  'cultural_content_published',
  'streak_reminder',
  'lesson_available',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Maps each server notification type to the channel it should surface on. */
export const NOTIFICATION_TYPE_CHANNEL: Record<NotificationType, NotificationChannelId> = {
  achievement_unlocked: NOTIFICATION_CHANNELS.achievements,
  cultural_content_published: NOTIFICATION_CHANNELS.content,
  streak_reminder: NOTIFICATION_CHANNELS.reminders,
  lesson_available: NOTIFICATION_CHANNELS.content,
};

/**
 * The `data` payload carried by every push. Deliberately small and text-free
 * of sensitive content — it's used for deep-linking on tap, not for display.
 * `route` is an Expo Router path validated against a safe-prefix allowlist
 * before navigation (see mobile deep-link handler).
 */
export interface NotificationData {
  type: NotificationType;
  /** Expo Router path to navigate to on tap, e.g. `/achievements`. */
  route?: string;
  /** Optional analytics/campaign correlation id. */
  campaignId?: string;
}

/** Lifecycle of an outbox row on the server. */
export const OUTBOX_STATUSES = [
  'pending',
  'processing',
  'sent',
  'failed',
  'cancelled',
] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

/** Body posted by the app to register/refresh a device's push token. */
export interface RegisterDeviceBody {
  /** Stable per-install id (survives token rotation). */
  installationId: string;
  /** Expo push token (`ExponentPushToken[...]`). */
  expoToken: string;
  platform: PushPlatform;
  /** IANA timezone, e.g. `Africa/Lagos` — never a fixed offset. */
  timezone: string;
  /** UI locale, e.g. `en`. Kept separate from the learning language. */
  locale: string;
  appVersion?: string;
}

export interface PushDeviceDto {
  id: string;
  installationId: string;
  platform: PushPlatform;
  timezone: string;
  locale: string;
  appVersion: string | null;
  enabled: boolean;
  lastSeenAt: string;
}
