import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1714400000000 implements MigrationInterface {
  name = 'CreateUsers1714400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL,
        "display_name" varchar(120) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "email_verified_at" timestamp with time zone,
        "password_reset_token" varchar(128),
        "password_reset_expires_at" timestamp with time zone,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_users_password_reset_token" ON "users" ("password_reset_token")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_password_reset_token"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
