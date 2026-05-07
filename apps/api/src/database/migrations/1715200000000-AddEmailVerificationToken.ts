import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationToken1715200000000 implements MigrationInterface {
  name = 'AddEmailVerificationToken1715200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "email_verification_token" varchar(128) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "email_verification_expires_at" timestamptz NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email_verification_token" ON "users" ("email_verification_token")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email_verification_token"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_expires_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_token"`);
  }
}
