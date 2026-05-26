import { MigrationInterface, QueryRunner } from 'typeorm';
import { ACHIEVEMENT_CATALOG } from '@lexiroot/shared';

export class CreateGamification1716400000000 implements MigrationInterface {
  name = 'CreateGamification1716400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "longest_streak_days" int NOT NULL DEFAULT 0
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_xp" ON "users" ("xp")`,
    );

    await queryRunner.query(`
      CREATE TABLE "achievements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(40) NOT NULL,
        "title" varchar(80) NOT NULL,
        "description" varchar(200) NOT NULL DEFAULT '',
        "icon_key" varchar(40) NOT NULL DEFAULT 'medal',
        "kind" varchar(40) NOT NULL,
        "threshold" int NOT NULL DEFAULT 0,
        "order" int NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_achievements" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_achievements_code" UNIQUE ("code")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_achievements_order" ON "achievements" ("order")`,
    );

    await queryRunner.query(`
      CREATE TABLE "user_achievements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "achievement_id" uuid NOT NULL,
        "earned_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_achievements" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_achievements_user_achievement" UNIQUE ("user_id", "achievement_id"),
        CONSTRAINT "FK_user_achievements_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_achievements_achievement"
          FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_achievements_user" ON "user_achievements" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_achievements_earned_at" ON "user_achievements" ("earned_at")`,
    );

    // Seed catalog. Idempotent via UQ_achievements_code.
    for (const a of ACHIEVEMENT_CATALOG) {
      await queryRunner.query(
        `INSERT INTO "achievements" ("code", "title", "description", "icon_key", "kind", "threshold", "order")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT ("code") DO NOTHING`,
        [a.code, a.title, a.description, a.iconKey, a.kind, a.threshold, a.order],
      );
    }

    // Backfill longest_streak_days from current value so existing users don't
    // lose credit for past streaks at the moment achievements roll out.
    await queryRunner.query(
      `UPDATE "users" SET "longest_streak_days" = GREATEST("longest_streak_days", "current_streak_days")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_achievements_earned_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_achievements_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_achievements"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_achievements_order"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "achievements"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_xp"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "longest_streak_days"`);
  }
}
