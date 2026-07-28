import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Admin-set exchange rates (units of a currency per 1 USD), keyed by
 * CurrencyCode, used only to blend non-USD provider revenue into USD
 * analytics totals — never for pricing. A map rather than a single field so
 * it scales with CURRENCY_CODES as more provider currencies get added.
 */
export class AddFxRatesToUsd1719100000000 implements MigrationInterface {
  name = 'AddFxRatesToUsd1719100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "platform_settings" ADD COLUMN "fx_rates_to_usd" jsonb NOT NULL DEFAULT '{"NGN": 1500}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "fx_rates_to_usd"`);
  }
}
