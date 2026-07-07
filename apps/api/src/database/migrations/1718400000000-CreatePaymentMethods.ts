import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Saved payment instruments. We store only the provider token plus display
 * metadata (brand/last4/expiry) — never the PAN — to stay out of PCI scope
 * (Rule 9c).
 */
export class CreatePaymentMethods1718400000000 implements MigrationInterface {
  name = 'CreatePaymentMethods1718400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payment_methods" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "provider" varchar(20) NOT NULL,
        "provider_pm_id" varchar(255) NOT NULL,
        "brand" varchar(40),
        "last4" varchar(4),
        "exp_month" integer,
        "exp_year" integer,
        "is_default" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_methods" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payment_methods_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_payment_methods_provider_pm" UNIQUE ("provider", "provider_pm_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_methods_user" ON "payment_methods" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payment_methods_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_methods"`);
  }
}
