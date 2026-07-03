import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Push-notification infrastructure:
 *  - push_devices           one row per (user, installation); holds the Expo token
 *  - notification_outbox     durable queue of pushes to send, drained by a worker
 *  - notification_deliveries per-device attempt/ticket/receipt record
 *
 * push_devices and notification_outbox are user-owned, so they get RLS
 * isolation policies matching the EnableRowLevelSecurity convention. The worker
 * connects as the table owner (exempt from RLS) so cross-user drains still work.
 */
export class CreatePushNotifications1717900000000 implements MigrationInterface {
  name = 'CreatePushNotifications1717900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "push_devices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "installation_id" varchar(128) NOT NULL,
        "expo_token" varchar(256) NOT NULL,
        "platform" varchar(10) NOT NULL,
        "timezone" varchar(64) NOT NULL,
        "locale" varchar(16) NOT NULL,
        "app_version" varchar(32),
        "enabled" boolean NOT NULL DEFAULT true,
        "last_seen_at" timestamptz NOT NULL DEFAULT now(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_devices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_push_devices_user_installation" UNIQUE ("user_id", "installation_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_push_devices_user" ON "push_devices" ("user_id")`,
    );
    // Same physical token can only be tied to one enabled device row at a time;
    // used to disable a token wholesale when Expo reports DeviceNotRegistered.
    await queryRunner.query(
      `CREATE INDEX "IDX_push_devices_token" ON "push_devices" ("expo_token")`,
    );

    await queryRunner.query(`
      CREATE TABLE "notification_outbox" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" varchar(48) NOT NULL,
        "title" varchar(128) NOT NULL,
        "body" varchar(256) NOT NULL,
        "data" jsonb NOT NULL DEFAULT '{}',
        "channel_id" varchar(32) NOT NULL,
        "scheduled_at" timestamptz NOT NULL DEFAULT now(),
        "status" varchar(16) NOT NULL DEFAULT 'pending',
        "dedupe_key" varchar(160),
        "attempts" integer NOT NULL DEFAULT 0,
        "last_error" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_outbox" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notification_outbox_dedupe" UNIQUE ("dedupe_key")
      )
    `);
    // The worker's hot query: due pending rows ordered by schedule.
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_outbox_due" ON "notification_outbox" ("status", "scheduled_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "notification_deliveries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "outbox_id" uuid NOT NULL,
        "device_id" uuid NOT NULL,
        "expo_ticket_id" varchar(128),
        "receipt_status" varchar(16),
        "attempts" integer NOT NULL DEFAULT 0,
        "error" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_deliveries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notification_deliveries_outbox" FOREIGN KEY ("outbox_id")
          REFERENCES "notification_outbox" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notification_deliveries_device" FOREIGN KEY ("device_id")
          REFERENCES "push_devices" ("id") ON DELETE CASCADE
      )
    `);
    // Receipt-checking pass looks up deliveries by their Expo ticket id.
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_deliveries_ticket" ON "notification_deliveries" ("expo_ticket_id")`,
    );

    for (const table of ['push_devices', 'notification_outbox']) {
      const policyName = `${table}_isolation`;
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`DROP POLICY IF EXISTS "${policyName}" ON "${table}"`);
      await queryRunner.query(`
        CREATE POLICY "${policyName}" ON "${table}"
          USING ("user_id" = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
          WITH CHECK ("user_id" = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['push_devices', 'notification_outbox']) {
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_isolation" ON "${table}"`);
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_deliveries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_outbox"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "push_devices"`);
  }
}
