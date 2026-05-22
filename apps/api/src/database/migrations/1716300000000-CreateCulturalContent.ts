import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCulturalContent1716300000000 implements MigrationInterface {
  name = 'CreateCulturalContent1716300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cultural_content" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" varchar(20) NOT NULL,
        "language" varchar(2) NOT NULL,
        "tier" varchar(20) NOT NULL DEFAULT 'beginner',
        "title_english" varchar(200) NOT NULL,
        "title_translated" varchar(200) NOT NULL DEFAULT '',
        "short_description" varchar(300) NOT NULL DEFAULT '',
        "body" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "cover_image_url" text NULL,
        "audio_url" text NULL,
        "audio_file_name" varchar(255) NULL,
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "views" int NOT NULL DEFAULT 0,
        "published_at" timestamptz NULL,
        "created_by_id" uuid NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cultural_content" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cultural_content_created_by"
          FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_cultural_content_type" ON "cultural_content" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cultural_content_language" ON "cultural_content" ("language")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cultural_content_tier" ON "cultural_content" ("tier")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cultural_content_status" ON "cultural_content" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cultural_content_created_at" ON "cultural_content" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cultural_content_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cultural_content_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cultural_content_tier"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cultural_content_language"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cultural_content_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cultural_content"`);
  }
}
