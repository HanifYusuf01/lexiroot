import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Failed attempts against a password-reset code.
 *
 * Login has had a lockout (`failed_login_attempts` + `locked_until`) since the
 * start; resetting a password had none. A reset code is six digits, lives for
 * an hour and was checked with a plain equality test, so an attacker who knew
 * an email address could simply try codes until one matched — with no limit,
 * no delay and nothing recorded. That is an account takeover, and it needs its
 * own counter rather than sharing the login one: otherwise guessing at somebody
 * else's reset would lock them out of signing in, turning one hole into two.
 */
export class AddPasswordResetAttempts1719700000000 implements MigrationInterface {
  name = 'AddPasswordResetAttempts1719700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "password_reset_attempts" int NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_attempts"`);
  }
}
