import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLessonEntries1715700000000 implements MigrationInterface {
  name = 'CreateLessonEntries1715700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "lesson_entries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "lesson_id" uuid NOT NULL,
        "kind" varchar(30) NOT NULL,
        "order_index" int NOT NULL DEFAULT 0,
        "payload" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lesson_entries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lesson_entries_lesson" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_entries_lesson" ON "lesson_entries" ("lesson_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_entries_lesson_kind_order" ON "lesson_entries" ("lesson_id", "kind", "order_index")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lesson_entries_lesson_kind_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lesson_entries_lesson"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lesson_entries"`);
  }
}
