import { MigrationInterface, QueryRunner } from 'typeorm';
import { ACHIEVEMENT_CATALOG } from '@lexiroot/shared';

/**
 * Seeds the tier-completion achievements (Beginner/Intermediate/Advanced
 * Complete). These are matched by code rather than threshold — a tier is not a
 * count — so they carry `threshold = 0`.
 *
 * Only the new rows are inserted; the original catalog was already seeded by
 * CreateGamification1716400000000 and is skipped by the code conflict clause.
 */
export class AddTierAchievements1719400000000 implements MigrationInterface {
  name = 'AddTierAchievements1719400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tierAchievements = ACHIEVEMENT_CATALOG.filter((a) => a.kind === 'tier_completed');
    for (const a of tierAchievements) {
      await queryRunner.query(
        `INSERT INTO "achievements" ("code", "title", "description", "icon_key", "kind", "threshold", "order")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT ("code") DO NOTHING`,
        [a.code, a.title, a.description, a.iconKey, a.kind, a.threshold, a.order],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades to user_achievements via FK_user_achievements_achievement.
    await queryRunner.query(
      `DELETE FROM "achievements" WHERE "kind" = 'tier_completed'`,
    );
  }
}
