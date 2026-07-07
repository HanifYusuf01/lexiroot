import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-user subscriptions. Provider-neutral: `provider` + the provider's opaque
 * customer/subscription ids. Access is derived from `status` + period, never
 * from a payment row (Rule 0/5). The partial unique index enforces at most one
 * "live" subscription per user — CANCELED (winding down) and EXPIRED are
 * excluded so a user can re-subscribe.
 */
export class CreateSubscriptions1718100000000 implements MigrationInterface {
  name = 'CreateSubscriptions1718100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "provider" varchar(20) NOT NULL,
        "provider_customer_id" varchar(255),
        "provider_subscription_id" varchar(255),
        "status" varchar(20) NOT NULL DEFAULT 'INCOMPLETE',
        "currency" char(3) NOT NULL,
        "current_period_start" timestamptz,
        "current_period_end" timestamptz,
        "cancel_at_period_end" boolean NOT NULL DEFAULT false,
        "canceled_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscriptions_plan"
          FOREIGN KEY ("plan_id") REFERENCES "subscription_plans" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_user" ON "subscriptions" ("user_id")`,
    );
    // A provider subscription id maps to exactly one row (webhook lookup key).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_subscriptions_provider_sub"
         ON "subscriptions" ("provider", "provider_subscription_id")
         WHERE "provider_subscription_id" IS NOT NULL`,
    );
    // At most one live subscription per user.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_subscriptions_one_live_per_user"
         ON "subscriptions" ("user_id")
         WHERE "status" NOT IN ('CANCELED', 'EXPIRED')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_subscriptions_one_live_per_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_subscriptions_provider_sub"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
  }
}
