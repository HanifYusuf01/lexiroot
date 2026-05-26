import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillXpLedgerFromCompletions1716600000000 implements MigrationInterface {
  name = 'BackfillXpLedgerFromCompletions1716600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // One row per historical lesson completion that awarded XP. Idempotent via
    // NOT EXISTS — re-running the migration won't double-insert. The
    // {backfilled: true} marker lets us tell historical rows apart from rows
    // recorded live by ProgressService.completeLesson.
    await queryRunner.query(`
      INSERT INTO "xp_ledger"
        ("user_id", "amount", "reason", "source_type", "source_id", "metadata", "created_at")
      SELECT
        lc."user_id",
        lc."xp_earned",
        'lesson_completion',
        'lesson',
        lc."lesson_id",
        jsonb_build_object(
          'correctCount', lc."correct_count",
          'totalCount',   lc."total_count",
          'backfilled',   true
        ),
        lc."completed_at"
      FROM "lesson_completions" lc
      WHERE lc."xp_earned" > 0
        AND NOT EXISTS (
          SELECT 1 FROM "xp_ledger" x
          WHERE x."user_id" = lc."user_id"
            AND x."source_type" = 'lesson'
            AND x."source_id"  = lc."lesson_id"
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Only delete the rows this backfill produced. Live rows recorded after
    // the migration ran don't have the {backfilled: true} marker.
    await queryRunner.query(
      `DELETE FROM "xp_ledger" WHERE "metadata" @> '{"backfilled": true}'::jsonb`,
    );
  }
}
