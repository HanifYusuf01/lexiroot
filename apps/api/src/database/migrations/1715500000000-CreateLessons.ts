import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLessons1715500000000 implements MigrationInterface {
  name = 'CreateLessons1715500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "lessons" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "language" varchar(2) NOT NULL,
        "level" varchar(20) NOT NULL,
        "category_id" uuid NOT NULL,
        "title" varchar(200) NOT NULL,
        "slug" varchar(220) NOT NULL,
        "short_description" varchar(200) NOT NULL DEFAULT '',
        "estimated_duration" varchar(30) NULL,
        "xp_reward" int NOT NULL DEFAULT 0,
        "order_in_unit" int NOT NULL DEFAULT 0,
        "type" varchar(30) NOT NULL,
        "speech_required" boolean NOT NULL DEFAULT false,
        "offline_available" boolean NOT NULL DEFAULT true,
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "created_by_id" uuid NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lessons" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lessons_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_lessons_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_lessons_slug" ON "lessons" ("slug")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_lessons_language" ON "lessons" ("language")`);
    await queryRunner.query(`CREATE INDEX "IDX_lessons_level" ON "lessons" ("level")`);
    await queryRunner.query(`CREATE INDEX "IDX_lessons_category" ON "lessons" ("category_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_lessons_status" ON "lessons" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_lessons_type" ON "lessons" ("type")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lessons_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lessons_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lessons_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lessons_level"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lessons_language"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lessons_slug"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lessons"`);
  }
}
