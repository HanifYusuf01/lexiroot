import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull, LessThan, Not } from 'typeorm';
import { BillingService } from '../modules/payments/billing.service';
import { Invoice } from '../modules/payments/entities/invoice.entity';
import { Subscription } from '../modules/payments/entities/subscription.entity';

// Only chase rows that have had time to settle normally via webhooks.
const STALE_AFTER_MS = 10 * 60 * 1000;

/**
 * Reconciliation sweep (Rule 7c): nothing may hang on a missed webhook. Re-query
 * the provider for subscriptions/invoices that look stuck and settle them
 * through the same billing convergence point. Idempotent — re-running is safe.
 */
@Injectable()
export class SubscriptionReconciliationJob {
  private readonly logger = new Logger(SubscriptionReconciliationJob.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly billing: BillingService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    await this.reconcileSubscriptions();
    await this.reconcileOpenInvoices();
  }

  /** Re-sync linked subscriptions that are stuck INCOMPLETE or past their period. */
  private async reconcileSubscriptions(): Promise<void> {
    const staleBefore = new Date(Date.now() - STALE_AFTER_MS);
    const subs = await this.dataSource.getRepository(Subscription).find({
      where: [
        {
          providerSubscriptionId: Not(IsNull()),
          status: 'INCOMPLETE',
          updatedAt: LessThan(staleBefore),
        },
        {
          providerSubscriptionId: Not(IsNull()),
          status: 'ACTIVE',
          currentPeriodEnd: LessThan(new Date()),
        },
        {
          providerSubscriptionId: Not(IsNull()),
          status: 'PAST_DUE',
          currentPeriodEnd: LessThan(new Date()),
        },
      ],
    });

    for (const sub of subs) {
      try {
        await this.billing.syncSubscription(sub.provider, sub.providerSubscriptionId!);
      } catch (err) {
        this.logger.error(`Reconcile subscription ${sub.id} failed: ${err}`);
      }
    }
    if (subs.length) this.logger.log(`Reconciled ${subs.length} subscription(s)`);
  }

  /** Re-check invoices stuck OPEN: settle to PAID if the provider now says so. */
  private async reconcileOpenInvoices(): Promise<void> {
    const staleBefore = new Date(Date.now() - STALE_AFTER_MS);
    const invoices = await this.dataSource.getRepository(Invoice).find({
      where: {
        status: 'OPEN',
        providerInvoiceId: Not(IsNull()),
        updatedAt: LessThan(staleBefore),
      },
    });

    for (const invoice of invoices) {
      try {
        // applyInvoicePaid re-fetches from the provider and no-ops unless paid,
        // so calling it for any OPEN invoice is safe and self-correcting.
        await this.billing.applyInvoicePaid(invoice.provider, invoice.providerInvoiceId!);
      } catch (err) {
        this.logger.error(`Reconcile invoice ${invoice.id} failed: ${err}`);
      }
    }
    if (invoices.length) this.logger.log(`Reconciled ${invoices.length} open invoice(s)`);
  }
}
