import { MigrationInterface, QueryRunner } from 'typeorm';

// Tables whose rows are owned by exactly one user, keyed by `user_id`. RLS
// scopes every read/write to the currently-set `app.current_user_id`. The
// app-side interceptor sets that GUC at the start of each authenticated
// request (see RlsContextInterceptor).
const USER_OWNED_TABLES = [
  'lesson_progress',
  'lesson_completions',
  'user_settings',
  'user_achievements',
  'xp_ledger',
  'feedback',
];

export class EnableRowLevelSecurity1716700000000 implements MigrationInterface {
  name = 'EnableRowLevelSecurity1716700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of USER_OWNED_TABLES) {
      const policyName = `${table}_isolation`;
      // We intentionally do NOT use FORCE ROW LEVEL SECURITY: the API
      // connects as the table owner (lexiroot), which is exempt from RLS
      // unless FORCED. That keeps admin queries — which legitimately need
      // cross-user reads — working without per-policy carve-outs. The
      // policies still apply if/when we add a non-owner DB role (analytics,
      // read-only, etc.) and protect against accidental cross-tenant queries
      // from such roles. NULLIF guards against the unset case (returns null,
      // policy fails closed, zero rows returned).
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`DROP POLICY IF EXISTS "${policyName}" ON "${table}"`);
      await queryRunner.query(`
        CREATE POLICY "${policyName}" ON "${table}"
          USING ("user_id" = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
          WITH CHECK ("user_id" = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of USER_OWNED_TABLES) {
      const policyName = `${table}_isolation`;
      await queryRunner.query(`DROP POLICY IF EXISTS "${policyName}" ON "${table}"`);
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
  }
}
