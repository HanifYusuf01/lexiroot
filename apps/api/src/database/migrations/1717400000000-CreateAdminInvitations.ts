import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminInvitations1717400000000 implements MigrationInterface {
  name = 'CreateAdminInvitations1717400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "admin_invitations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL,
        "display_name" varchar NOT NULL,
        "role" varchar(20) NOT NULL,
        "country" varchar(2),
        "token" varchar(128) NOT NULL,
        "invited_by_id" uuid,
        "invited_by_name" varchar,
        "expires_at" timestamptz NOT NULL,
        "accepted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_invitations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admin_invitations_token" UNIQUE ("token")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_invitations_email" ON "admin_invitations" ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_invitations_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_invitations"`);
  }
}
