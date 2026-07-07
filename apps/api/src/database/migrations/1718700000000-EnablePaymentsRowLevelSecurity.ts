import { MigrationInterface, QueryRunner } from 'typeorm';

// Payment tables owned by exactly one user, keyed by `user_id`. Mirrors the
// original EnableRowLevelSecurity migration: policies scope every read/write to
// the `app.current_user_id` GUC set per request by RlsContextInterceptor.
// `webhook_events` and `plan_provider_prices` are NOT user-owned (system/admin
// data) so they get no policy.
const USER_OWNED_TABLES = ['subscriptions', 'invoices', 'payments', 'payment_methods'];

export class EnablePaymentsRowLevelSecurity1718700000000 implements MigrationInterface {
  name = 'EnablePaymentsRowLevelSecurity1718700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of USER_OWNED_TABLES) {
      const policyName = `${table}_isolation`;
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
