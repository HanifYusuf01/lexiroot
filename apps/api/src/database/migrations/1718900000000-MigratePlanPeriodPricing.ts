import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Move the pricing model from "per-month headline `price` + billed `total`, with
 * the interval guessed from the plan name" to "explicit `period`
 * (Month/Quarter/Year) + `price` is the amount charged once per period".
 *
 * Backfills existing rows so they keep charging the same amount:
 * - `period` is derived from the name (the old interval heuristic).
 * - `price` is promoted to the real per-cycle charge — `total` when set, else the
 *   old per-month `price` × the number of months in the period.
 * - `total` is cleared (the column is retained but no longer used).
 *
 * The same promotion is applied to each per-currency amount in the `prices` map.
 * This is a one-way data transform; `down` is a no-op (the original per-month
 * headline can't be reconstructed).
 */
export class MigratePlanPeriodPricing1718900000000 implements MigrationInterface {
  name = 'MigratePlanPeriodPricing1718900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Base (USD) columns: set period + promote the charge into price.
    await queryRunner.query(`
      UPDATE "subscription_plans"
      SET
        "period" = CASE
          WHEN "name" ILIKE '%year%' OR "name" ILIKE '%annual%' THEN 'Year'
          WHEN "name" ILIKE '%quarter%' THEN 'Quarter'
          ELSE 'Month'
        END,
        "price" = CASE
          WHEN "name" ILIKE '%year%' OR "name" ILIKE '%annual%' THEN COALESCE("total", "price" * 12)
          WHEN "name" ILIKE '%quarter%' THEN COALESCE("total", "price" * 3)
          ELSE "price"
        END,
        "total" = NULL
    `);

    // Per-currency overrides (jsonb): promote each currency's charge the same way
    // and drop its now-unused `total` key.
    await queryRunner.query(`
      DO $$
      DECLARE
        p RECORD;
        cur TEXT;
        entry JSONB;
        new_prices JSONB;
        mult INT;
        base_price NUMERIC;
        base_total TEXT;
        charge NUMERIC;
      BEGIN
        FOR p IN
          SELECT "id", "name", "prices" FROM "subscription_plans" WHERE "prices" <> '{}'::jsonb
        LOOP
          mult := CASE
            WHEN p."name" ILIKE '%year%' OR p."name" ILIKE '%annual%' THEN 12
            WHEN p."name" ILIKE '%quarter%' THEN 3
            ELSE 1
          END;
          new_prices := '{}'::jsonb;
          FOR cur IN SELECT jsonb_object_keys(p."prices") LOOP
            entry := p."prices" -> cur;
            base_price := (entry ->> 'price')::numeric;
            base_total := entry ->> 'total';
            IF base_total IS NULL THEN
              charge := base_price * mult;
            ELSE
              charge := base_total::numeric;
            END IF;
            new_prices := new_prices || jsonb_build_object(cur, jsonb_build_object('price', charge));
          END LOOP;
          UPDATE "subscription_plans" SET "prices" = new_prices WHERE "id" = p."id";
        END LOOP;
      END $$;
    `);
  }

  public async down(): Promise<void> {
    // One-way data transform — the original per-month headline price and billed
    // totals aren't recoverable, so there is nothing safe to reverse.
  }
}
