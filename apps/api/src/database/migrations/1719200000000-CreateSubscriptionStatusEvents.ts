import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Append-only log of subscription status transitions, written by
 * SubscriptionStateService.apply() alongside every state change. Exists
 * purely so analytics can answer "what was this subscription's status at
 * time T" precisely instead of approximating from create/cancel/period
 * snapshot fields — those don't capture intermediate detours (e.g. a PAST_DUE
 * stretch that later recovered to ACTIVE).
 */
export class CreateSubscriptionStatusEvents1719200000000 implements MigrationInterface {
  name = 'CreateSubscriptionStatusEvents1719200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscription_status_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "subscription_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "from_status" varchar(20) NOT NULL,
        "to_status" varchar(20) NOT NULL,
        "occurred_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_status_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscription_status_events_subscription"
          FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscription_status_events_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_status_events_subscription_id" ON "subscription_status_events" ("subscription_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_status_events_occurred_at" ON "subscription_status_events" ("occurred_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subscription_status_events"`);
  }
}
