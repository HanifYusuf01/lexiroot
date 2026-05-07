import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserPhone1715100000000 implements MigrationInterface {
  name = 'DropUserPhone1715100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "phone"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "phone" varchar(32) NULL`);
  }
}
