import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoginLockout1717700000000 implements MigrationInterface {
  name = 'AddLoginLockout1717700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "failed_login_attempts" int NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "locked_until" timestamptz NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locked_until"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "failed_login_attempts"`);
  }
}
