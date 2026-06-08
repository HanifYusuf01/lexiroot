import { MigrationInterface, QueryRunner } from 'typeorm';

interface PlanSeed {
  scope: 'individual' | 'family';
  name: string;
  price: number;
  period: string;
  total: number | null;
  premium: boolean;
  features: string[];
  sortOrder: number;
}

const PREMIUM_FEATURES = [
  'Unlimited access to lessons',
  'Advanced speech & tone feedback',
  'Full cultural library (stories, proverbs, traditions)',
  'Faster progress tracking',
];

const FAMILY_FEATURES = [
  'Unlimited access to lessons',
  'Allows up to 3 Users',
  'Advanced speech & tone feedback',
  'Full cultural library (stories, proverbs, traditions)',
  'Faster progress tracking',
];

const FREE_FEATURES = [
  'Limited access to lessons',
  'Basic pronunciation practice',
  'Limited access to stories',
];

const SEED: PlanSeed[] = [
  // Individual
  { scope: 'individual', name: 'Free', price: 0, period: 'Month', total: null, premium: false, features: FREE_FEATURES, sortOrder: 0 },
  { scope: 'individual', name: 'Monthly', price: 20, period: 'Month', total: null, premium: true, features: PREMIUM_FEATURES, sortOrder: 1 },
  { scope: 'individual', name: 'Quarterly', price: 18, period: 'Month', total: 54, premium: true, features: PREMIUM_FEATURES, sortOrder: 2 },
  { scope: 'individual', name: 'Yearly', price: 18, period: 'Month', total: 214, premium: true, features: PREMIUM_FEATURES, sortOrder: 3 },
  // Family
  { scope: 'family', name: 'Free', price: 0, period: 'Month', total: null, premium: false, features: FREE_FEATURES, sortOrder: 0 },
  { scope: 'family', name: 'Monthly', price: 20, period: 'Month', total: null, premium: true, features: FAMILY_FEATURES, sortOrder: 1 },
  { scope: 'family', name: 'Quarterly', price: 18, period: 'Month', total: 54, premium: true, features: FAMILY_FEATURES, sortOrder: 2 },
  { scope: 'family', name: 'Yearly', price: 18, period: 'Month', total: 214, premium: true, features: FAMILY_FEATURES, sortOrder: 3 },
];

export class CreateSubscriptionPlans1717100000000 implements MigrationInterface {
  name = 'CreateSubscriptionPlans1717100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscription_plans" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "scope" varchar(20) NOT NULL,
        "name" varchar(60) NOT NULL,
        "price" numeric(10,2) NOT NULL DEFAULT 0,
        "period" varchar(20) NOT NULL DEFAULT 'Month',
        "total" numeric(10,2),
        "premium" boolean NOT NULL DEFAULT false,
        "features" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "sort_order" int NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_plans" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_plans_scope" ON "subscription_plans" ("scope", "sort_order")`,
    );

    for (const plan of SEED) {
      await queryRunner.query(
        `INSERT INTO "subscription_plans"
           ("scope", "name", "price", "period", "total", "premium", "features", "sort_order")
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
        [
          plan.scope,
          plan.name,
          plan.price,
          plan.period,
          plan.total,
          plan.premium,
          JSON.stringify(plan.features),
          plan.sortOrder,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_plans_scope"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_plans"`);
  }
}
