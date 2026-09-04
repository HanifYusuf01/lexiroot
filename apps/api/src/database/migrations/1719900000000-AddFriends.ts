import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Friends, for the friends leaderboard.
 *
 * Mutual by design: an invitation has to be accepted before either person
 * appears on the other's board. A one-way "follow" would be simpler, but it
 * would also let anyone drop a stranger onto their leaderboard without consent,
 * and the whole point of the board is that you chose who is on it.
 *
 * `friendships` stores both directions. One row with an ordering rule would
 * save space and cost every query a CASE — two rows keep "my friends" a plain
 * indexed lookup, and the pair is written and deleted together.
 */
export class AddFriends1719900000000 implements MigrationInterface {
  name = 'AddFriends1719900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "friend_invites" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "inviter_id" uuid NOT NULL,
        "invited_email" varchar(255) NOT NULL,
        "token" varchar(64) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "accepted_at" timestamptz,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_friend_invites" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_friend_invites_token" UNIQUE ("token"),
        CONSTRAINT "FK_friend_invites_inviter"
          FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_friend_invites_inviter" ON "friend_invites" ("inviter_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_friend_invites_email" ON "friend_invites" ("invited_email")`,
    );

    await queryRunner.query(`
      CREATE TABLE "friendships" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "friend_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_friendships" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_friendships_pair" UNIQUE ("user_id", "friend_id"),
        CONSTRAINT "CK_friendships_not_self" CHECK ("user_id" <> "friend_id"),
        CONSTRAINT "FK_friendships_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_friendships_friend"
          FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_friendships_user" ON "friendships" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "friendships"`);
    await queryRunner.query(`DROP TABLE "friend_invites"`);
  }
}
