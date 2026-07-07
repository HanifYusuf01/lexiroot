import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * One invoice per subscription billing period (Rule 2c: unique on
 * subscription_id + period_start). Amount/currency/period are snapshotted here
 * and never recomputed from the plan (Rule 8b). `user_id` is denormalised so
 * RLS can scope by owner without a join.
 */
export class CreateInvoices1718200000000 implements MigrationInterface {
  name = 'CreateInvoices1718200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "subscription_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "provider" varchar(20) NOT NULL,
        "provider_invoice_id" varchar(255),
        "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
        "amount_minor" integer NOT NULL,
        "currency" char(3) NOT NULL,
        "period_start" timestamptz NOT NULL,
        "period_end" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_invoices_subscription"
          FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invoices_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_invoices_subscription_period" UNIQUE ("subscription_id", "period_start")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_invoices_provider_invoice"
         ON "invoices" ("provider", "provider_invoice_id")
         WHERE "provider_invoice_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_status" ON "invoices" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_invoices_provider_invoice"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
  }
}
