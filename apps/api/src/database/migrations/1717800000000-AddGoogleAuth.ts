import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleAuth1717800000000 implements MigrationInterface {
  name = 'AddGoogleAuth1717800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Social (Google) accounts have no local password.
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "google_id" varchar NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_google_id" ON "users" ("google_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_google_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
    // Re-applying NOT NULL would fail if any social accounts exist; left as-is
    // intentionally so the revert is safe.
  }
}
