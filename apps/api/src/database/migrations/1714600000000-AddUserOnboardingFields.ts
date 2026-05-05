import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserOnboardingFields1714600000000 implements MigrationInterface {
  name = 'AddUserOnboardingFields1714600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "language" varchar(2) NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "level" varchar(20) NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "learning_reason" varchar(20) NULL`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "xp" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "current_streak_days" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "lessons_completed" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "last_active_at" timestamptz NULL`,
    );
    // Backfill so existing rows aren't immediately considered inactive.
    await queryRunner.query(
      `UPDATE "users" SET "last_active_at" = "created_at" WHERE "last_active_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_last_active_at" ON "users" ("last_active_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_last_active_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_active_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lessons_completed"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "current_streak_days"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "xp"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "learning_reason"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "level"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "language"`);
  }
}
