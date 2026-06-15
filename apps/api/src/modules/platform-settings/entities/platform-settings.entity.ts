import { Check, Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { AdminSessionTimeout, ReminderTimeZone } from '@lexiroot/shared';

/**
 * Singleton row holding platform-wide admin configuration. Enforced to a single
 * row via a CHECK on the primary key (id = 1).
 */
@Entity('platform_settings')
@Check(`"id" = 1`)
export class PlatformSettings {
  @PrimaryColumn({ type: 'int', default: 1 })
  id!: number;

  // General
  @Column({ name: 'platform_name', type: 'varchar', length: 120, default: 'LexiRoot' })
  platformName!: string;

  @Column({
    name: 'platform_tagline',
    type: 'varchar',
    length: 200,
    default: 'Your language. Your roots.',
  })
  platformTagline!: string;

  @Column({ name: 'admin_email', type: 'varchar', length: 160, default: 'admin@lexiroot.com' })
  adminEmail!: string;

  @Column({ name: 'support_email', type: 'varchar', length: 160, default: 'support@lexiroot.com' })
  supportEmail!: string;

  // Maintenance
  @Column({ name: 'maintenance_mode', type: 'boolean', default: false })
  maintenanceMode!: boolean;

  @Column({ name: 'show_downtime_message', type: 'boolean', default: false })
  showDowntimeMessage!: boolean;

  // Push notifications
  @Column({ name: 'daily_streak_reminder', type: 'boolean', default: true })
  dailyStreakReminder!: boolean;

  @Column({ name: 'lesson_available_reminder', type: 'boolean', default: true })
  lessonAvailableReminder!: boolean;

  @Column({ name: 'achievement_badge_alerts', type: 'boolean', default: true })
  achievementBadgeAlerts!: boolean;

  @Column({ name: 'default_reminder_time', type: 'varchar', length: 5, default: '18:00' })
  defaultReminderTime!: string;

  @Column({ name: 'reminder_time_zone', type: 'varchar', length: 20, default: 'learner-local' })
  reminderTimeZone!: ReminderTimeZone;

  // System & admin alerts
  @Column({ name: 'critical_error_alerts', type: 'boolean', default: true })
  criticalErrorAlerts!: boolean;

  @Column({ name: 'payment_failure_alerts', type: 'boolean', default: true })
  paymentFailureAlerts!: boolean;

  // Email notifications
  @Column({ name: 'email_verification_emails', type: 'boolean', default: true })
  emailVerificationEmails!: boolean;

  @Column({ name: 'admin_invitation_emails', type: 'boolean', default: true })
  adminInvitationEmails!: boolean;

  @Column({ name: 'welcome_email', type: 'boolean', default: true })
  welcomeEmail!: boolean;

  @Column({ name: 'subscription_confirmation', type: 'boolean', default: true })
  subscriptionConfirmation!: boolean;

  @Column({ name: 'password_reset_emails', type: 'boolean', default: true })
  passwordResetEmails!: boolean;

  @Column({ name: 'inactivity_reengagement', type: 'boolean', default: true })
  inactivityReengagement!: boolean;

  // Security & privacy
  @Column({ name: 'two_factor_auth', type: 'boolean', default: true })
  twoFactorAuth!: boolean;

  @Column({ name: 'single_sign_on', type: 'boolean', default: false })
  singleSignOn!: boolean;

  @Column({ name: 'admin_session_timeout', type: 'varchar', length: 10, default: '2h' })
  adminSessionTimeout!: AdminSessionTimeout;

  @Column({ name: 'max_failed_login_attempts', type: 'int', default: 4 })
  maxFailedLoginAttempts!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
