import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLessonMeta1715800000000 implements MigrationInterface {
  name = 'AddLessonMeta1715800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD COLUMN "meta" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "meta"`);
  }
}
