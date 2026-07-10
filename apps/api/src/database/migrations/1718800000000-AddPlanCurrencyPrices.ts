import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-currency price overrides for subscription plans. The plan's `price`/`total`
 * columns stay the base (USD) amount; `prices` holds a JSON map of non-base
 * currency amounts, e.g. `{ "NGN": { "price": 9000, "total": null } }`. Amounts
 * are authored deliberately per currency (not FX-derived).
 */
export class AddPlanCurrencyPrices1718800000000 implements MigrationInterface {
  name = 'AddPlanCurrencyPrices1718800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD COLUMN "prices" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "prices"`);
  }
}
