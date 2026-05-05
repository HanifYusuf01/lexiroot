import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserCountryAndPhone1714700000000 implements MigrationInterface {
  name = 'AddUserCountryAndPhone1714700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "country" varchar(2) NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "phone" varchar(32) NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_users_country" ON "users" ("country")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_country"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "country"`);
  }
}
