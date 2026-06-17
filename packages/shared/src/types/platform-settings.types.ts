export const REMINDER_TIME_ZONES = ['learner-local', 'wat', 'utc'] as const;
export type ReminderTimeZone = (typeof REMINDER_TIME_ZONES)[number];

export const REMINDER_TIME_ZONE_LABELS: Record<ReminderTimeZone, string> = {
  'learner-local': 'Learner local time',
  wat: 'WAT (UTC + 1)',
  utc: 'UTC',
};

export const ADMIN_SESSION_TIMEOUTS = ['30m', '1h', '2h', '8h', '24h'] as const;
export type AdminSessionTimeout = (typeof ADMIN_SESSION_TIMEOUTS)[number];

export const ADMIN_SESSION_TIMEOUT_LABELS: Record<AdminSessionTimeout, string> = {
  '30m': '30 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '8h': '8 hours',
  '24h': '24 hours',
};

export interface PlatformSettings {
  // General
  platformName: string;
  platformTagline: string;
  adminEmail: string;
  supportEmail: string;
  // Maintenance
  maintenanceMode: boolean;
  showDowntimeMessage: boolean;
  // Push notifications
  dailyStreakReminder: boolean;
  lessonAvailableReminder: boolean;
  achievementBadgeAlerts: boolean;
  defaultReminderTime: string; // HH:mm
  reminderTimeZone: ReminderTimeZone;
  // System & admin alerts
  criticalErrorAlerts: boolean;
  paymentFailureAlerts: boolean;
  // Security & privacy
  twoFactorAuth: boolean;
  singleSignOn: boolean;
  adminSessionTimeout: AdminSessionTimeout;
  maxFailedLoginAttempts: number;
  updatedAt: string;
}

export type UpdatePlatformSettings = Partial<Omit<PlatformSettings, 'updatedAt'>>;

/** Subset of settings safe to expose to unauthenticated clients (mobile). */
export interface PublicPlatformSettings {
  platformName: string;
  platformTagline: string;
  maintenanceMode: boolean;
  showDowntimeMessage: boolean;
}
