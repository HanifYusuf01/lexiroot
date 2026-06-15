import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPlatformSettingsTrial1717300000000 implements MigrationInterface {
  name = 'DropPlatformSettingsTrial1717300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "free_trial_length"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "trial_plan_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "platform_settings" ADD COLUMN "free_trial_length" int NOT NULL DEFAULT 7`,
    );
    await queryRunner.query(`ALTER TABLE "platform_settings" ADD COLUMN "trial_plan_id" uuid`);
  }
}
