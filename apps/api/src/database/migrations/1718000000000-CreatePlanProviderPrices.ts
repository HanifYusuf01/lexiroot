import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Maps a catalog plan (`subscription_plans`) onto each provider's price/product.
 * Keeps `subscription_plans` provider-neutral: the same plan can carry a Stripe
 * price, a Paystack plan code and an Apple product id side by side. Rows are
 * created by the admin "sync provider" step, never hardcoded.
 */
export class CreatePlanProviderPrices1718000000000 implements MigrationInterface {
  name = 'CreatePlanProviderPrices1718000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plan_provider_prices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "plan_id" uuid NOT NULL,
        "provider" varchar(20) NOT NULL,
        "provider_product_id" varchar(255),
        "provider_price_id" varchar(255) NOT NULL,
        "amount_minor" integer NOT NULL,
        "currency" char(3) NOT NULL,
        "interval" varchar(20) NOT NULL DEFAULT 'month',
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plan_provider_prices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_plan_provider_prices_plan"
          FOREIGN KEY ("plan_id") REFERENCES "subscription_plans" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_plan_provider_prices_plan_provider" UNIQUE ("plan_id", "provider")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "plan_provider_prices"`);
  }
}
