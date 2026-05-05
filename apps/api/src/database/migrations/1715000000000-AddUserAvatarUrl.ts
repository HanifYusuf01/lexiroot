import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAvatarUrl1715000000000 implements MigrationInterface {
  name = 'AddUserAvatarUrl1715000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "avatar_url" varchar(512) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
  }
}
