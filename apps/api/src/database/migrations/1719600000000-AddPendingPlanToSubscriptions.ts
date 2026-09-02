import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A downgrade the subscriber has asked for but hasn't reached yet.
 *
 * Downgrades can't be applied when they're requested: the current period is
 * already paid for at the bigger plan's price, so writing `plan_id` straight
 * away would take away access they've bought. The provider is told to bill the
 * new price from the next invoice; these two columns hold our side of that
 * promise until the renewal lands and `plan_id` moves.
 *
 * Nullable with no default — the overwhelmingly common state is "nothing
 * pending", and an empty column costs nothing on the existing rows.
 */
export class AddPendingPlanToSubscriptions1719600000000 implements MigrationInterface {
  name = 'AddPendingPlanToSubscriptions1719600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
        ADD COLUMN "pending_plan_id" uuid,
        ADD COLUMN "pending_plan_effective_at" timestamptz
    `);
    // RESTRICT rather than CASCADE: deleting a plan somebody is scheduled to
    // move onto should fail loudly, not silently drop their pending change.
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
        ADD CONSTRAINT "FK_subscriptions_pending_plan"
          FOREIGN KEY ("pending_plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_pending_plan"
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
        DROP COLUMN "pending_plan_effective_at",
        DROP COLUMN "pending_plan_id"
    `);
  }
}
