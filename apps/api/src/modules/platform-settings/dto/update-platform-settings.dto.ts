import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  ADMIN_SESSION_TIMEOUTS,
  REMINDER_TIME_ZONES,
  type AdminSessionTimeout,
  type CurrencyCode,
  type ReminderTimeZone,
} from '@lexiroot/shared';

export class UpdatePlatformSettingsDto {
  // General
  @IsOptional()
  @IsString()
  @Length(1, 120)
  platformName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  platformTagline?: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  // Maintenance
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsBoolean()
  showDowntimeMessage?: boolean;

  // Push notifications
  @IsOptional()
  @IsBoolean()
  dailyStreakReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  lessonAvailableReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  achievementBadgeAlerts?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'defaultReminderTime must be HH:MM (24-hour)' })
  defaultReminderTime?: string;

  @IsOptional()
  @IsIn(REMINDER_TIME_ZONES as readonly string[])
  reminderTimeZone?: ReminderTimeZone;

  // System & admin alerts
  @IsOptional()
  @IsBoolean()
  criticalErrorAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentFailureAlerts?: boolean;

  // Security & privacy
  @IsOptional()
  @IsBoolean()
  twoFactorAuth?: boolean;

  @IsOptional()
  @IsBoolean()
  singleSignOn?: boolean;

  @IsOptional()
  @IsIn(ADMIN_SESSION_TIMEOUTS as readonly string[])
  adminSessionTimeout?: AdminSessionTimeout;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxFailedLoginAttempts?: number;

  // Revenue reporting — each key/value is checked against the currency
  // catalog and validated as a positive rate in PlatformSettingsService.update,
  // since class-validator has no built-in "map of X" shape to declare here.
  @IsOptional()
  @IsObject()
  fxRatesToUsd?: Partial<Record<CurrencyCode, number>>;
}
