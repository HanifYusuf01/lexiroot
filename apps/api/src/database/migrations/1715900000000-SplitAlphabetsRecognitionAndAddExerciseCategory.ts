import { MigrationInterface, QueryRunner } from 'typeorm';

interface LessonRow {
  id: string;
  slug: string;
  meta: Record<string, unknown> | null;
}

export class SplitAlphabetsRecognitionAndAddExerciseCategory1715900000000
  implements MigrationInterface
{
  name = 'SplitAlphabetsRecognitionAndAddExerciseCategory1715900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "category" varchar(30)`,
    );

    await queryRunner.query(
      `UPDATE "exercises" SET "category" = CASE
         WHEN "sub_type" = 'recognition' THEN 'recognition'
         WHEN "sub_type" = 'word-arrange' THEN 'sentence'
         WHEN "sub_type" = 'correct-meaning' THEN 'vocabulary'
         WHEN "sub_type" = 'listen-select' THEN 'letters-numbers'
         ELSE 'vocabulary'
       END
       WHERE "category" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "exercises" ALTER COLUMN "category" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_exercises_category" ON "exercises" ("category")`,
    );

    const lessons = (await queryRunner.query(
      `SELECT id, slug, meta FROM "lessons" WHERE "type" = 'alphabets-recognition'`,
    )) as LessonRow[];

    for (const lesson of lessons) {
      const recognitionEntries = (await queryRunner.query(
        `SELECT id FROM "lesson_entries" WHERE "lesson_id" = $1 AND "kind" = 'recognition-item'`,
        [lesson.id],
      )) as Array<{ id: string }>;

      const meta = (lesson.meta ?? {}) as Record<string, unknown>;
      const hasPrompt = meta && typeof meta === 'object' && 'recognitionPrompt' in meta;

      if (recognitionEntries.length === 0 && !hasPrompt) {
        await queryRunner.query(
          `UPDATE "lessons" SET "type" = 'letters-numbers' WHERE "id" = $1`,
          [lesson.id],
        );
        continue;
      }

      const recognitionSlug = `${lesson.slug}-recognition`.slice(0, 220);
      const cloneRows = (await queryRunner.query(
        `INSERT INTO "lessons" (
           "language", "level", "category_id", "title", "slug", "short_description",
           "estimated_duration", "xp_reward", "order_in_unit", "type",
           "speech_required", "offline_available", "status", "meta", "created_by_id"
         )
         SELECT
           "language", "level", "category_id",
           "title" || ' (Recognition)',
           $2,
           "short_description",
           "estimated_duration", "xp_reward", "order_in_unit", 'recognition',
           "speech_required", "offline_available", "status", "meta", "created_by_id"
         FROM "lessons"
         WHERE "id" = $1
         RETURNING id`,
        [lesson.id, recognitionSlug],
      )) as Array<{ id: string }>;
      const recognitionLessonId = cloneRows[0].id;

      if (recognitionEntries.length > 0) {
        await queryRunner.query(
          `UPDATE "lesson_entries" SET "lesson_id" = $1
             WHERE "lesson_id" = $2 AND "kind" = 'recognition-item'`,
          [recognitionLessonId, lesson.id],
        );
      }

      await queryRunner.query(
        `UPDATE "lessons" SET "type" = 'letters-numbers',
           "meta" = (COALESCE("meta", '{}'::jsonb) - 'recognitionPrompt')
         WHERE "id" = $1`,
        [lesson.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exercises_category"`);
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN IF EXISTS "category"`);

    await queryRunner.query(
      `UPDATE "lessons" SET "type" = 'alphabets-recognition'
         WHERE "type" IN ('letters-numbers', 'recognition')`,
    );
  }
}
