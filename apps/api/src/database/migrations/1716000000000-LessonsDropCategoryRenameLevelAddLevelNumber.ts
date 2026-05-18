import { MigrationInterface, QueryRunner } from 'typeorm';

export class LessonsDropCategoryRenameLevelAddLevelNumber1716000000000
  implements MigrationInterface
{
  name = 'LessonsDropCategoryRenameLevelAddLevelNumber1716000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lessons_category"`);
    await queryRunner.query(
      `ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "FK_lessons_category"`,
    );
    await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "category_id"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lessons_level"`);
    await queryRunner.query(`ALTER TABLE "lessons" RENAME COLUMN "level" TO "tier"`);
    await queryRunner.query(`CREATE INDEX "IDX_lessons_tier" ON "lessons" ("tier")`);

    await queryRunner.query(
      `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "level" int NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_lessons_level" ON "lessons" ("level")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lessons_level"`);
    await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "level"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lessons_tier"`);
    await queryRunner.query(`ALTER TABLE "lessons" RENAME COLUMN "tier" TO "level"`);
    await queryRunner.query(`CREATE INDEX "IDX_lessons_level" ON "lessons" ("level")`);

    await queryRunner.query(`ALTER TABLE "lessons" ADD COLUMN "category_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_lessons_category" ON "lessons" ("category_id")`,
    );
    // Note: cannot restore FK to categories(id) generically — re-link via data fix if needed.
  }
}
