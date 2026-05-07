import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';

const ADMIN_EMAIL = 'test@example.com';
const ADMIN_PASSWORD = 'password123#';
const ADMIN_DISPLAY_NAME = 'Example';
const BCRYPT_ROUNDS = 12;

async function run() {
  await dataSource.initialize();
  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
    const result = await dataSource.query(
      `INSERT INTO "users" ("email", "display_name", "password_hash", "role", "email_verified_at")
       VALUES ($1, $2, $3, 'admin', now())
       ON CONFLICT ("email") DO UPDATE
         SET "password_hash" = EXCLUDED."password_hash",
             "display_name" = EXCLUDED."display_name",
             "role" = 'admin',
             "email_verified_at" = COALESCE("users"."email_verified_at", now())
       RETURNING "id", "email", "role"`,
      [ADMIN_EMAIL, ADMIN_DISPLAY_NAME, passwordHash],
    );
    console.log('Admin ready:', result[0]);
  } finally {
    await dataSource.destroy();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
