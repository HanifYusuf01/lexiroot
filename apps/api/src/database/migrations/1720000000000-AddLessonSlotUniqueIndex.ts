import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * One lesson per (language, tier, level, type).
 *
 * LessonsService.assertNoTypeClash already enforces this, but only as a
 * read-then-write check: two saves landing together can both pass it, and rows
 * created before the check existed were never validated. The index makes the
 * database the final word.
 *
 * Archived lessons are included on purpose — the service counts them too, so
 * archiving a lesson does not free its slot.
 *
 * If duplicates already exist the migration stops and lists them instead of
 * picking one to delete; each row carries authored content, so which one to
 * keep is an editorial call. Re-level or delete the extras, then re-run.
 */
export class AddLessonSlotUniqueIndex1720000000000 implements MigrationInterface {
  name = 'AddLessonSlotUniqueIndex1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const duplicates: {
      language: string;
      tier: string;
      level: number;
      type: string;
      ids: string[];
    }[] = await queryRunner.query(`
      SELECT "language", "tier", "level", "type",
             array_agg("id"::text ORDER BY "created_at") AS "ids"
      FROM "lessons"
      GROUP BY "language", "tier", "level", "type"
      HAVING count(*) > 1
    `);

    if (duplicates.length > 0) {
      const lines = duplicates.map(
        (d) => `  ${d.language} / ${d.tier} / level ${d.level} / ${d.type}: ${d.ids.join(', ')}`,
      );
      throw new Error(
        'Cannot add the lesson slot unique index: these slots have more than one lesson.\n' +
          lines.join('\n') +
          '\nMove or delete the extra lessons in the admin, then run migrations again.',
      );
    }

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_lessons_slot" ON "lessons" ("language", "tier", "level", "type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_lessons_slot"`);
  }
}
