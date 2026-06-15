import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailNotificationToggles1717500000000 implements MigrationInterface {
  name = 'AddEmailNotificationToggles1717500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "platform_settings" ADD COLUMN "email_verification_emails" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "platform_settings" ADD COLUMN "admin_invitation_emails" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "admin_invitation_emails"`);
    await queryRunner.query(
      `ALTER TABLE "platform_settings" DROP COLUMN "email_verification_emails"`,
    );
  }
}
