import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, LessThan } from 'typeorm';
import type { PaymentsConfig } from '../config/payments.config';
import { EntitlementService } from '../modules/payments/entitlement.service';
import { Subscription } from '../modules/payments/entities/subscription.entity';
import { SubscriptionStateService } from '../modules/payments/subscription-state.service';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Deferred revocation (Rules 5c/7b). Cancellation and past-due keep access until
 * the period (+grace) elapses; this daily job flips those to EXPIRED once it
 * has. A safety net for missed provider webhooks — the reconciliation job also
 * covers this from the provider side.
 */
@Injectable()
export class SubscriptionExpiryJob {
  private readonly logger = new Logger(SubscriptionExpiryJob.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly state: SubscriptionStateService,
    private readonly entitlements: EntitlementService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async run(): Promise<void> {
    const graceMs = this.config.getOrThrow<PaymentsConfig>('payments').graceDays * DAY_MS;
    const now = Date.now();
    const repo = this.dataSource.getRepository(Subscription);

    // CANCELED subs past period end → EXPIRED (access already gone; tidy state).
    const canceled = await repo.find({
      where: { status: 'CANCELED', currentPeriodEnd: LessThan(new Date(now)) },
    });
    // PAST_DUE past period end + grace → dunning exhausted → EXPIRED (revoke).
    const pastDue = await repo.find({
      where: { status: 'PAST_DUE', currentPeriodEnd: LessThan(new Date(now - graceMs)) },
    });
    // Abandoned checkouts: INCOMPLETE and never advanced within a day → EXPIRED,
    // so stale "awaiting payment" rows don't accumulate. A late webhook can still
    // open a fresh subscription on the learner's next checkout.
    const abandoned = await repo.find({
      where: { status: 'INCOMPLETE', createdAt: LessThan(new Date(now - DAY_MS)) },
    });

    const candidates = [...canceled, ...pastDue, ...abandoned];
    let expired = 0;
    for (const sub of candidates) {
      try {
        await this.dataSource.transaction(async (manager) => {
          const applied = await this.state.apply(manager, sub.id, { status: 'EXPIRED' });
          if (applied) expired += 1;
        });
        this.entitlements.invalidate(sub.userId);
      } catch (err) {
        this.logger.error(`Failed to expire subscription ${sub.id}: ${err}`);
      }
    }

    if (expired) this.logger.log(`Expired ${expired} subscription(s)`);
  }
}
