import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserDeletedAt1719300000000 implements MigrationInterface {
  name = 'AddUserDeletedAt1719300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "deleted_at" timestamptz NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
  }
}
