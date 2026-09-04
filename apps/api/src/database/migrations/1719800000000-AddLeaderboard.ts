import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Weekly leaderboard: leagues, opt-out, admin-set Root Point values, and a
 * snapshot per completed week.
 *
 * Current-week standings are not stored — they are summed from `xp_ledger`,
 * which already records every award with a timestamp. Only *finished* weeks are
 * snapshotted, because those are the ones that must stop moving: they decide
 * promotion, demotion and the "up 3 places" delta, and recomputing them later
 * from a ledger that keeps growing would let last week's result change.
 */
export class AddLeaderboard1719800000000 implements MigrationInterface {
  name = 'AddLeaderboard1719800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "league" varchar(20) NOT NULL DEFAULT 'bronze',
        ADD COLUMN "leaderboard_opt_out" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "platform_settings"
        ADD COLUMN "rp_rates" jsonb NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN "rp_repeat_multipliers" jsonb NOT NULL DEFAULT '[1, 0.4, 0.2, 0.1, 0]'::jsonb,
        ADD COLUMN "league_config" jsonb NOT NULL DEFAULT
          '{"promoteTop": 5, "demoteBottom": 5, "minWeeklyRp": 1}'::jsonb
    `);

    // How many times a lesson has been completed, so a review can be worth less
    // than the first pass. The existing unique (user, lesson) row is updated on
    // a repeat rather than inserted, so without this the count is unknowable.
    await queryRunner.query(`
      ALTER TABLE "lesson_completions"
        ADD COLUMN "attempts" int NOT NULL DEFAULT 1
    `);

    await queryRunner.query(`
      CREATE TABLE "leaderboard_snapshots" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "period_start" date NOT NULL,
        "language" varchar(10),
        "level" varchar(20),
        "league" varchar(20) NOT NULL,
        "root_points" int NOT NULL DEFAULT 0,
        "rank" int NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leaderboard_snapshots" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_leaderboard_snapshots_user_period" UNIQUE ("user_id", "period_start"),
        CONSTRAINT "FK_leaderboard_snapshots_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_leaderboard_snapshots_period" ON "leaderboard_snapshots" ("period_start")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "leaderboard_snapshots"`);
    await queryRunner.query(`ALTER TABLE "lesson_completions" DROP COLUMN "attempts"`);
    await queryRunner.query(`
      ALTER TABLE "platform_settings"
        DROP COLUMN "league_config",
        DROP COLUMN "rp_repeat_multipliers",
        DROP COLUMN "rp_rates"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "leaderboard_opt_out",
        DROP COLUMN "league"
    `);
  }
}
