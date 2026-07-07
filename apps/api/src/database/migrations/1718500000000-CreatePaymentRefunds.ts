import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Append-only refund/credit ledger. Refunds are new rows, never in-place edits
 * to a payment (Rule 8c) — the payment's own status flips to REFUNDED but the
 * money movement is recorded here for audit/reconciliation.
 */
export class CreatePaymentRefunds1718500000000 implements MigrationInterface {
  name = 'CreatePaymentRefunds1718500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payment_refunds" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "payment_id" uuid NOT NULL,
        "provider" varchar(20) NOT NULL,
        "provider_refund_id" varchar(255),
        "amount_minor" integer NOT NULL,
        "currency" char(3) NOT NULL,
        "reason" varchar(255),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_refunds" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payment_refunds_payment"
          FOREIGN KEY ("payment_id") REFERENCES "payments" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_payment_refunds_provider_refund" UNIQUE ("provider", "provider_refund_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_refunds"`);
  }
}
