import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inbound provider webhook log. Doubles as the idempotency ledger: the unique
 * `(provider, provider_event_id)` means a replayed webhook is a no-op insert
 * conflict and never re-runs a transition (Rules 2a, 3c). The raw payload is
 * kept for disputes/debugging.
 */
export class CreateWebhookEvents1718600000000 implements MigrationInterface {
  name = 'CreateWebhookEvents1718600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "webhook_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "provider" varchar(20) NOT NULL,
        "provider_event_id" varchar(255) NOT NULL,
        "type" varchar(120) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'received',
        "error" text,
        "received_at" timestamptz NOT NULL DEFAULT now(),
        "processed_at" timestamptz,
        CONSTRAINT "PK_webhook_events" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_webhook_events_provider_event" UNIQUE ("provider", "provider_event_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "webhook_events"`);
  }
}
