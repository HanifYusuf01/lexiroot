import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLessonProgress1716200000000 implements MigrationInterface {
  name = 'CreateLessonProgress1716200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "lesson_progress" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "tier" varchar(20) NOT NULL,
        "level" int NOT NULL,
        "sub_idx" int NOT NULL DEFAULT 0,
        "sub_lesson_id" uuid,
        "step_kind" varchar(32) NOT NULL DEFAULT 'intro',
        "step_index" int NOT NULL DEFAULT 0,
        "correct_count" int NOT NULL DEFAULT 0,
        "xp" int NOT NULL DEFAULT 0,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_lesson_progress_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_lesson_progress_user_tier_level" ON "lesson_progress" ("user_id", "tier", "level")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_progress_user" ON "lesson_progress" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lesson_progress_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lesson_progress_user_tier_level"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lesson_progress"`);
  }
}
