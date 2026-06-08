import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  ADMIN_SESSION_TIMEOUTS,
  REMINDER_TIME_ZONES,
  type AdminSessionTimeout,
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

  // Email notifications
  @IsOptional()
  @IsBoolean()
  welcomeEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  subscriptionConfirmation?: boolean;

  @IsOptional()
  @IsBoolean()
  passwordResetEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  inactivityReengagement?: boolean;

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

  // Trial / subscription config
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  freeTrialLength?: number;

  @IsOptional()
  @IsUUID()
  trialPlanId?: string | null;
}
