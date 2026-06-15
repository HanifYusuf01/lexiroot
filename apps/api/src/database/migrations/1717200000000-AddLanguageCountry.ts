import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLanguageCountry1717200000000 implements MigrationInterface {
  name = 'AddLanguageCountry1717200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "languages" ADD COLUMN "country" varchar(2) NULL`);
    // Existing MVP languages (Yoruba, Igbo, Hausa) are all Nigerian.
    await queryRunner.query(`UPDATE "languages" SET "country" = 'NG' WHERE "country" IS NULL`);
    await queryRunner.query(`ALTER TABLE "languages" ALTER COLUMN "country" SET NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_languages_country" ON "languages" ("country")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_languages_country"`);
    await queryRunner.query(`ALTER TABLE "languages" DROP COLUMN "country"`);
  }
}
