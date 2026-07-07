import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Charge attempts against an invoice. Idempotency is enforced two ways:
 *  - unique `idempotency_key` so a retried/replayed charge request never
 *    double-charges (Rule 2b),
 *  - unique `(invoice_id, attempt_no)` so each dunning attempt is one row.
 */
export class CreatePayments1718300000000 implements MigrationInterface {
  name = 'CreatePayments1718300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "invoice_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "provider" varchar(20) NOT NULL,
        "provider_payment_id" varchar(255),
        "status" varchar(20) NOT NULL DEFAULT 'INITIATED',
        "amount_minor" integer NOT NULL,
        "currency" char(3) NOT NULL,
        "attempt_no" integer NOT NULL DEFAULT 1,
        "idempotency_key" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payments_invoice"
          FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payments_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_payments_idempotency_key" UNIQUE ("idempotency_key"),
        CONSTRAINT "UQ_payments_invoice_attempt" UNIQUE ("invoice_id", "attempt_no")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_payments_provider_payment"
         ON "payments" ("provider", "provider_payment_id")
         WHERE "provider_payment_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_status" ON "payments" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_payments_provider_payment"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
  }
}
