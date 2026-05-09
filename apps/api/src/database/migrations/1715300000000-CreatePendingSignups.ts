import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePendingSignups1715300000000 implements MigrationInterface {
  name = 'CreatePendingSignups1715300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email_verification_token"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verification_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verification_expires_at"`,
    );

    await queryRunner.query(`
      CREATE TABLE "pending_signups" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL,
        "password_hash" varchar NOT NULL,
        "display_name" varchar NOT NULL,
        "language" varchar(2) NULL,
        "level" varchar(20) NULL,
        "learning_reason" varchar(20) NULL,
        "country" varchar(2) NULL,
        "code" varchar(6) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pending_signups" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pending_signups_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pending_signups_email" ON "pending_signups" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pending_signups_code" ON "pending_signups" ("code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pending_signups_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pending_signups_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pending_signups"`);

    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "email_verification_token" varchar(128) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "email_verification_expires_at" timestamptz NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email_verification_token" ON "users" ("email_verification_token")`,
    );
  }
}
