import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserActiveDays1716800000000 implements MigrationInterface {
  name = 'CreateUserActiveDays1716800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_active_days" (
        "user_id" uuid NOT NULL,
        "day" date NOT NULL,
        CONSTRAINT "PK_user_active_days" PRIMARY KEY ("user_id", "day"),
        CONSTRAINT "FK_user_active_days_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_active_days_day" ON "user_active_days" ("day")`,
    );

    // Backfill from existing activity so DAU/WAU/MAU and the activity chart
    // aren't empty on day one. All days are bucketed in UTC.
    await queryRunner.query(`
      INSERT INTO "user_active_days" ("user_id", "day")
      SELECT "user_id", ("completed_at" AT TIME ZONE 'UTC')::date
      FROM "lesson_completions"
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "user_active_days" ("user_id", "day")
      SELECT "user_id", ("updated_at" AT TIME ZONE 'UTC')::date
      FROM "lesson_progress"
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "user_active_days" ("user_id", "day")
      SELECT "id", ("last_active_at" AT TIME ZONE 'UTC')::date
      FROM "users"
      WHERE "last_active_at" IS NOT NULL
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_active_days_day"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_active_days"`);
  }
}
