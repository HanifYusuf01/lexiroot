import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateXpLedger1716500000000 implements MigrationInterface {
  name = 'CreateXpLedger1716500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "xp_ledger" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "amount" int NOT NULL,
        "reason" varchar(40) NOT NULL,
        "source_type" varchar(30) NULL,
        "source_id" uuid NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_xp_ledger" PRIMARY KEY ("id"),
        CONSTRAINT "FK_xp_ledger_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_xp_ledger_user_created" ON "xp_ledger" ("user_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_xp_ledger_created_at" ON "xp_ledger" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_xp_ledger_reason" ON "xp_ledger" ("reason")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_xp_ledger_reason"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_xp_ledger_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_xp_ledger_user_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "xp_ledger"`);
  }
}
