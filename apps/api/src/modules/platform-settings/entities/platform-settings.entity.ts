import { Check, Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type {
  AdminSessionTimeout,
  CurrencyCode,
  LeagueConfig,
  ReminderTimeZone,
  RootPointRates,
} from '@lexiroot/shared';

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

  // Security & privacy
  @Column({ name: 'two_factor_auth', type: 'boolean', default: true })
  twoFactorAuth!: boolean;

  @Column({ name: 'single_sign_on', type: 'boolean', default: false })
  singleSignOn!: boolean;

  @Column({ name: 'admin_session_timeout', type: 'varchar', length: 10, default: '2h' })
  adminSessionTimeout!: AdminSessionTimeout;

  @Column({ name: 'max_failed_login_attempts', type: 'int', default: 4 })
  maxFailedLoginAttempts!: number;

  /**
   * Manually-set exchange rates (units of that currency per 1 USD), used only
   * to blend non-USD provider revenue (e.g. Paystack's NGN) into the
   * USD-denominated analytics totals — never for pricing/billing, which stays
   * in each provider's own currency. Deliberately admin-set rather than
   * fetched live: there's no FX provider integrated, and a silently-stale
   * live rate would be worse than one the admin knows they set and must
   * revisit. Keyed by CurrencyCode; USD itself is never a key (rate is 1).
   */
  @Column({ name: 'fx_rates_to_usd', type: 'jsonb', default: () => `'{"NGN": 1500}'::jsonb` })
  fxRatesToUsd!: Partial<Record<CurrencyCode, number>>;

  /**
   * Root Points per activity. Empty means "use the defaults" — an admin only
   * stores the values they actually changed, so a new activity added in code
   * starts at its default rather than silently at zero.
   */
  @Column({ name: 'rp_rates', type: 'jsonb', default: () => `'{}'::jsonb` })
  rpRates!: RootPointRates;

  /**
   * What a repeat of the same lesson is worth, as a fraction of full RP,
   * indexed by prior completions. Past the end of the list a repeat earns
   * nothing — the anti-farming rule, expressed as data so it can be tuned
   * without a release.
   */
  @Column({
    name: 'rp_repeat_multipliers',
    type: 'jsonb',
    default: () => `'[1, 0.4, 0.2, 0.1, 0]'::jsonb`,
  })
  rpRepeatMultipliers!: number[];

  /** Promotion/demotion boundaries applied at the weekly rollover. */
  @Column({
    name: 'league_config',
    type: 'jsonb',
    default: () => `'{"promoteTop": 5, "demoteBottom": 5, "minWeeklyRp": 1}'::jsonb`,
  })
  leagueConfig!: LeagueConfig;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
