import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserSettings1714800000000 implements MigrationInterface {
  name = 'CreateUserSettings1714800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_settings" (
        "user_id" uuid PRIMARY KEY,
        "sound_haptics" boolean NOT NULL DEFAULT false,
        "language_level" varchar(20) NULL,
        "lesson_difficulty" varchar(20) NULL,
        "autoplay_audio" boolean NOT NULL DEFAULT false,
        "voice_playback_speed" varchar(20) NULL,
        "microphone_access" boolean NOT NULL DEFAULT false,
        "streak_reminder" boolean NOT NULL DEFAULT false,
        "achievement_alerts" boolean NOT NULL DEFAULT false,
        "daily_reminder" boolean NOT NULL DEFAULT false,
        "daily_reminder_time" varchar(5) NULL,
        "cultural_content_alert" boolean NOT NULL DEFAULT false,
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_user_settings_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_settings"`);
  }
}
