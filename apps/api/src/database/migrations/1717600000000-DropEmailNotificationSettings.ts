import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Email lifecycle messages (verification, invitation, welcome, password reset,
 * subscription confirmation, inactivity) are always-on and no longer
 * admin-toggleable, so their settings columns are removed.
 */
export class DropEmailNotificationSettings1717600000000 implements MigrationInterface {
  name = 'DropEmailNotificationSettings1717600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "platform_settings" DROP COLUMN "email_verification_emails"`,
    );
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "admin_invitation_emails"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "welcome_email"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "subscription_confirmation"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "password_reset_emails"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "inactivity_reengagement"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "platform_settings" ADD COLUMN "inactivity_reengagement" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "platform_settings" ADD COLUMN "password_reset_emails" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "platform_settings" ADD COLUMN "subscription_confirmation" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "platform_settings" ADD COLUMN "welcome_email" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "platform_settings" ADD COLUMN "admin_invitation_emails" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "platform_settings" ADD COLUMN "email_verification_emails" boolean NOT NULL DEFAULT true`,
    );
  }
}
