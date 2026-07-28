import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppleAuth1719000000000 implements MigrationInterface {
  name = 'AddAppleAuth1719000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "apple_id" varchar NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_apple_id" ON "users" ("apple_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_apple_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "apple_id"`);
  }
}
