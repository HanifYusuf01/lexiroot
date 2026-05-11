import { MigrationInterface, QueryRunner } from 'typeorm';

const SEED_CATEGORIES: { name: string; slug: string }[] = [
  { name: 'Greetings', slug: 'greetings' },
  { name: 'Basics', slug: 'basics' },
  { name: 'Family & Relationships', slug: 'family-relationships' },
  { name: 'Common Phrases', slug: 'common-phrases' },
  { name: 'Food & Eating', slug: 'food-eating' },
  { name: 'Daily Life', slug: 'daily-life' },
  { name: 'People & Culture', slug: 'people-culture' },
];

export class CreateCategories1715400000000 implements MigrationInterface {
  name = 'CreateCategories1715400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(80) NOT NULL,
        "slug" varchar(100) NOT NULL,
        "sort_order" int NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_categories_slug" ON "categories" ("slug")`,
    );

    for (let i = 0; i < SEED_CATEGORIES.length; i++) {
      const { name, slug } = SEED_CATEGORIES[i];
      await queryRunner.query(
        `INSERT INTO "categories" ("name", "slug", "sort_order") VALUES ($1, $2, $3)`,
        [name, slug, i],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_slug"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
