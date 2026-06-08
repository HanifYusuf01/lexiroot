import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLanguages1716900000000 implements MigrationInterface {
  name = 'CreateLanguages1716900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "languages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(3) NOT NULL,
        "name" varchar(60) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_languages" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_languages_code" UNIQUE ("code")
      )
    `);

    // Seed the three MVP languages. Yoruba is live; Igbo and Hausa are in build.
    await queryRunner.query(`
      INSERT INTO "languages" ("code", "name", "status") VALUES
        ('yo', 'Yoruba', 'connected'),
        ('ig', 'Igbo', 'in-development'),
        ('ha', 'Hausa', 'in-development')
      ON CONFLICT ("code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "languages"`);
  }
}
