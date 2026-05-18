import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLessonCompletions1716100000000 implements MigrationInterface {
  name = 'CreateLessonCompletions1716100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "lesson_completions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "lesson_id" uuid NOT NULL,
        "xp_earned" int NOT NULL DEFAULT 0,
        "correct_count" int NOT NULL DEFAULT 0,
        "total_count" int NOT NULL DEFAULT 0,
        "completed_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_lesson_completions_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_lesson_completions_lesson"
          FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_lesson_completions_user_lesson" ON "lesson_completions" ("user_id", "lesson_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_completions_user" ON "lesson_completions" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lesson_completions_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lesson_completions_user_lesson"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lesson_completions"`);
  }
}
