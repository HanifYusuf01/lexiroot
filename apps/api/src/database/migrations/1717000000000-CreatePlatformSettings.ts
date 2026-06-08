import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlatformSettings1717000000000 implements MigrationInterface {
  name = 'CreatePlatformSettings1717000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "platform_settings" (
        "id" int NOT NULL DEFAULT 1,
        "platform_name" varchar(120) NOT NULL DEFAULT 'LexiRoot',
        "platform_tagline" varchar(200) NOT NULL DEFAULT 'Your language. Your roots.',
        "admin_email" varchar(160) NOT NULL DEFAULT 'admin@lexiroot.com',
        "support_email" varchar(160) NOT NULL DEFAULT 'support@lexiroot.com',
        "maintenance_mode" boolean NOT NULL DEFAULT false,
        "show_downtime_message" boolean NOT NULL DEFAULT false,
        "daily_streak_reminder" boolean NOT NULL DEFAULT true,
        "lesson_available_reminder" boolean NOT NULL DEFAULT true,
        "achievement_badge_alerts" boolean NOT NULL DEFAULT true,
        "default_reminder_time" varchar(5) NOT NULL DEFAULT '18:00',
        "reminder_time_zone" varchar(20) NOT NULL DEFAULT 'learner-local',
        "critical_error_alerts" boolean NOT NULL DEFAULT true,
        "payment_failure_alerts" boolean NOT NULL DEFAULT true,
        "welcome_email" boolean NOT NULL DEFAULT true,
        "subscription_confirmation" boolean NOT NULL DEFAULT true,
        "password_reset_emails" boolean NOT NULL DEFAULT true,
        "inactivity_reengagement" boolean NOT NULL DEFAULT true,
        "two_factor_auth" boolean NOT NULL DEFAULT true,
        "single_sign_on" boolean NOT NULL DEFAULT false,
        "admin_session_timeout" varchar(10) NOT NULL DEFAULT '2h',
        "max_failed_login_attempts" int NOT NULL DEFAULT 4,
        "free_trial_length" int NOT NULL DEFAULT 7,
        "trial_plan_id" uuid,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_platform_settings" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_platform_settings_singleton" CHECK ("id" = 1)
      )
    `);

    // Seed the single config row with all defaults.
    await queryRunner.query(
      `INSERT INTO "platform_settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "platform_settings"`);
  }
}
