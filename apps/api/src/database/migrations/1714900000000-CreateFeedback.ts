import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedback1714900000000 implements MigrationInterface {
  name = 'CreateFeedback1714900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "feedback" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "rating" smallint NOT NULL,
        "message" text,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_feedback_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_feedback_rating" CHECK ("rating" BETWEEN 1 AND 5)
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_feedback_user_id" ON "feedback" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_feedback_created_at" ON "feedback" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback"`);
  }
}
