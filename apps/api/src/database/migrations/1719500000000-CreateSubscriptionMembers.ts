import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Family plan sharing: one paid subscription entitling several separate
 * accounts. Each seat is its own user with its own language and progress — only
 * the entitlement is shared, so nothing here touches learning data.
 *
 * A row starts life as a pending invite (`user_id` null, `token` set) and
 * becomes a membership when someone accepts it. Keeping both states in one
 * table mirrors `admin_invitations` and means the seat count is a single query.
 */
export class CreateSubscriptionMembers1719500000000 implements MigrationInterface {
  name = 'CreateSubscriptionMembers1719500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscription_members" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "subscription_id" uuid NOT NULL,
        "user_id" uuid,
        "invited_email" varchar(255) NOT NULL,
        "token" varchar(64) NOT NULL,
        "invited_by_id" uuid,
        "expires_at" timestamptz NOT NULL,
        "accepted_at" timestamptz,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_subscription_members_token" UNIQUE ("token"),
        CONSTRAINT "FK_subscription_members_subscription"
          FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscription_members_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscription_members_invited_by"
          FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_members_subscription"
         ON "subscription_members" ("subscription_id")`,
    );

    // Entitlement lookups hit this on every /auth/me, so it must be indexed.
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_members_user"
         ON "subscription_members" ("user_id")`,
    );

    // One live seat per (subscription, user). Partial so revoked rows don't
    // block re-inviting somebody who previously left the family.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_subscription_members_active_user"
        ON "subscription_members" ("subscription_id", "user_id")
        WHERE "user_id" IS NOT NULL AND "revoked_at" IS NULL
    `);

    // One outstanding invite per (subscription, email) — re-inviting the same
    // address should update the existing invite, not stack duplicates.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_subscription_members_pending_email"
        ON "subscription_members" ("subscription_id", "invited_email")
        WHERE "accepted_at" IS NULL AND "revoked_at" IS NULL
    `);

    // Defence in depth, matching the other user-owned tables. Not enforced
    // today (the API connects as the table owner), but keeps the policy correct
    // for when a non-owner role is introduced. A member may read their own
    // seat row; the owner reads seats on subscriptions they own.
    await queryRunner.query(`ALTER TABLE "subscription_members" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "subscription_members_self" ON "subscription_members"
        USING (
          "user_id" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
          OR EXISTS (
            SELECT 1 FROM "subscriptions" s
             WHERE s."id" = "subscription_members"."subscription_id"
               AND s."user_id" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
          )
        )
    `);

    // Widen the subscriptions policy so an accepted member can read the
    // subscription entitling them, not just one they own.
    await queryRunner.query(`DROP POLICY IF EXISTS "subscriptions_isolation" ON "subscriptions"`);
    await queryRunner.query(`
      CREATE POLICY "subscriptions_isolation" ON "subscriptions"
        USING (
          "user_id" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
          OR EXISTS (
            SELECT 1 FROM "subscription_members" m
             WHERE m."subscription_id" = "subscriptions"."id"
               AND m."user_id" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
               AND m."accepted_at" IS NOT NULL
               AND m."revoked_at" IS NULL
          )
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS "subscriptions_isolation" ON "subscriptions"`);
    await queryRunner.query(`
      CREATE POLICY "subscriptions_isolation" ON "subscriptions"
        USING ("user_id" = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_members"`);
  }
}
