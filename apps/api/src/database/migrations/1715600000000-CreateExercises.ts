import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExercises1715600000000 implements MigrationInterface {
  name = 'CreateExercises1715600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "exercises" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "lesson_id" uuid NOT NULL,
        "sub_type" varchar(30) NOT NULL,
        "order_index" int NOT NULL DEFAULT 0,
        "payload" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exercises" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exercises_lesson" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_exercises_lesson" ON "exercises" ("lesson_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_exercises_lesson_order" ON "exercises" ("lesson_id", "order_index")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exercises_lesson_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exercises_lesson"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exercises"`);
  }
}
