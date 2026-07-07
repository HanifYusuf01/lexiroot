import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import type { ProviderKey } from '@lexiroot/shared';
import { EntitlementService } from './entitlement.service';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { Subscription } from './entities/subscription.entity';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import type {
  ProviderInvoiceSnapshot,
  ProviderSubSnapshot,
} from './providers/payment-provider.interface';
import { SubscriptionStateService } from './subscription-state.service';

/**
 * The convergence point every path (checkout, webhook, reconciliation) funnels
 * through (Rule 4a). Each method re-fetches the object from the provider before
 * trusting it (Rule 3b), then mirrors state idempotently inside one transaction
 * with the subscription row locked (Rules 2a/2d), and invalidates the
 * entitlement cache (Rule 5b). Nothing here charges money — Stripe drives that;
 * we react.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly registry: PaymentProviderRegistry,
    private readonly state: SubscriptionStateService,
    private readonly entitlements: EntitlementService,
  ) {}

  /** Link a completed hosted checkout to our subscription, then sync it. */
  async linkCheckout(providerKey: ProviderKey, sessionId: string): Promise<void> {
    const provider = this.registry.get(providerKey);
    const outcome = await provider.fetchCheckoutOutcome(sessionId);
    if (!outcome.subscriptionId || !outcome.providerSubscriptionId) {
      this.logger.warn(`linkCheckout: session ${sessionId} missing subscription linkage`);
      return;
    }

    const sub = await this.dataSource
      .getRepository(Subscription)
      .findOne({ where: { id: outcome.subscriptionId } });
    if (!sub) {
      this.logger.warn(`linkCheckout: local subscription ${outcome.subscriptionId} not found`);
      return;
    }

    // Persist the provider ids so subsequent webhooks resolve by them, then pull
    // the authoritative status/period.
    const snapshot = await provider.fetchSubscription(outcome.providerSubscriptionId);
    await this.dataSource.transaction(async (manager) => {
      await this.state.apply(manager, sub.id, {
        status: snapshot.status,
        currentPeriodStart: snapshot.currentPeriodStart,
        currentPeriodEnd: snapshot.currentPeriodEnd,
        cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
        canceledAt: snapshot.canceledAt,
        providerSubscriptionId: snapshot.providerSubscriptionId,
        providerCustomerId: snapshot.providerCustomerId ?? outcome.providerCustomerId,
      });
    });
    this.entitlements.invalidate(sub.userId);
  }

  /** Mirror a provider subscription (customer.subscription.created/updated/deleted). */
  async syncSubscription(providerKey: ProviderKey, providerSubscriptionId: string): Promise<void> {
    const provider = this.registry.get(providerKey);
    const snapshot = await provider.fetchSubscription(providerSubscriptionId);

    const sub = await this.findByProviderSub(providerKey, providerSubscriptionId);
    if (!sub) {
      this.logger.warn(
        `syncSubscription: no local subscription for ${providerKey}/${providerSubscriptionId}`,
      );
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      await this.applySubscriptionSnapshot(manager, sub.id, snapshot);
    });
    this.entitlements.invalidate(sub.userId);
  }

  /**
   * The money convergence point: an invoice was paid. Marks the invoice PAID,
   * records the payment, advances the period and sets the subscription ACTIVE —
   * all idempotently. Called from webhook (invoice.paid) and reconciliation.
   */
  async applyInvoicePaid(providerKey: ProviderKey, providerInvoiceId: string): Promise<void> {
    const provider = this.registry.get(providerKey);
    const invoiceSnap = await provider.fetchInvoice(providerInvoiceId);
    // Trust the re-fetched status, not the trigger (Rule 3b). This makes the
    // method safe to call speculatively from reconciliation for any OPEN
    // invoice: it self-corrects and no-ops unless the provider says PAID.
    if (invoiceSnap.status !== 'PAID' && invoiceSnap.paymentStatus !== 'PAID') {
      this.logger.debug(`applyInvoicePaid: invoice ${providerInvoiceId} not paid yet; skipping`);
      return;
    }
    if (!invoiceSnap.providerSubscriptionId) {
      this.logger.warn(`applyInvoicePaid: invoice ${providerInvoiceId} has no subscription`);
      return;
    }
    const sub = await this.findByProviderSub(providerKey, invoiceSnap.providerSubscriptionId);
    if (!sub) {
      this.logger.warn(
        `applyInvoicePaid: no local subscription for ${invoiceSnap.providerSubscriptionId}`,
      );
      return;
    }

    // Authoritative period comes from the subscription, not the invoice line.
    const subSnap = await provider.fetchSubscription(invoiceSnap.providerSubscriptionId);

    await this.dataSource.transaction(async (manager) => {
      // Lock the subscription for the duration of the money movement (Rule 2d).
      await manager
        .getRepository(Subscription)
        .createQueryBuilder('sub')
        .setLock('pessimistic_write')
        .where('sub.id = :id', { id: sub.id })
        .getOne();

      const invoice = await this.upsertInvoice(manager, sub, providerKey, invoiceSnap, 'PAID');
      await this.upsertPayment(manager, sub, providerKey, invoice, invoiceSnap, 'PAID');

      // Advance period + activate (guarded, replay-safe).
      await this.state.apply(manager, sub.id, {
        status: subSnap.status === 'ACTIVE' ? 'ACTIVE' : subSnap.status,
        currentPeriodStart: subSnap.currentPeriodStart,
        currentPeriodEnd: subSnap.currentPeriodEnd,
        cancelAtPeriodEnd: subSnap.cancelAtPeriodEnd,
        canceledAt: subSnap.canceledAt,
      });
    });
    this.entitlements.invalidate(sub.userId);
  }

  /** A renewal charge failed → PAST_DUE, access retained during dunning. */
  async applyInvoicePaymentFailed(
    providerKey: ProviderKey,
    providerInvoiceId: string,
  ): Promise<void> {
    const provider = this.registry.get(providerKey);
    const invoiceSnap = await provider.fetchInvoice(providerInvoiceId);
    if (!invoiceSnap.providerSubscriptionId) return;
    const sub = await this.findByProviderSub(providerKey, invoiceSnap.providerSubscriptionId);
    if (!sub) return;

    const subSnap = await provider.fetchSubscription(invoiceSnap.providerSubscriptionId);

    await this.dataSource.transaction(async (manager) => {
      const invoice = await this.upsertInvoice(manager, sub, providerKey, invoiceSnap, null);
      await this.upsertPayment(manager, sub, providerKey, invoice, invoiceSnap, 'FAILED');
      await this.state.apply(manager, sub.id, {
        // Trust the provider's status (usually past_due); keep the period.
        status: subSnap.status,
        currentPeriodStart: subSnap.currentPeriodStart,
        currentPeriodEnd: subSnap.currentPeriodEnd,
        cancelAtPeriodEnd: subSnap.cancelAtPeriodEnd,
        canceledAt: subSnap.canceledAt,
      });
    });
    this.entitlements.invalidate(sub.userId);
  }

  // --- helpers ---

  private findByProviderSub(
    providerKey: ProviderKey,
    providerSubscriptionId: string,
  ): Promise<Subscription | null> {
    return this.dataSource
      .getRepository(Subscription)
      .findOne({ where: { provider: providerKey, providerSubscriptionId } });
  }

  private async applySubscriptionSnapshot(
    manager: EntityManager,
    subscriptionId: string,
    snapshot: ProviderSubSnapshot,
  ): Promise<void> {
    await this.state.apply(manager, subscriptionId, {
      status: snapshot.status,
      currentPeriodStart: snapshot.currentPeriodStart,
      currentPeriodEnd: snapshot.currentPeriodEnd,
      cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
      canceledAt: snapshot.canceledAt,
      providerCustomerId: snapshot.providerCustomerId,
    });
  }

  /**
   * Find-or-create the invoice for this snapshot. `forceStatus` guards the
   * OPEN/DRAFT → PAID move (idempotent — a replay finds it already PAID and
   * no-ops); pass null to mirror the provider's status.
   */
  private async upsertInvoice(
    manager: EntityManager,
    sub: Subscription,
    providerKey: ProviderKey,
    snap: ProviderInvoiceSnapshot,
    forceStatus: 'PAID' | null,
  ): Promise<Invoice> {
    const repo = manager.getRepository(Invoice);
    const periodStart = snap.periodStart ?? sub.currentPeriodStart ?? new Date();
    const periodEnd = snap.periodEnd ?? sub.currentPeriodEnd ?? new Date();

    let invoice =
      (await repo.findOne({
        where: { provider: providerKey, providerInvoiceId: snap.providerInvoiceId },
      })) ??
      (await repo.findOne({ where: { subscriptionId: sub.id, periodStart } }));

    if (!invoice) {
      invoice = repo.create({
        subscriptionId: sub.id,
        userId: sub.userId,
        provider: providerKey,
        providerInvoiceId: snap.providerInvoiceId,
        status: forceStatus ?? snap.status,
        amountMinor: snap.amountMinor,
        currency: snap.currency,
        periodStart,
        periodEnd,
      });
      return repo.save(invoice);
    }

    // Snapshot fields (amount/currency/period never recomputed — Rule 8b).
    invoice.providerInvoiceId = snap.providerInvoiceId;
    if (forceStatus === 'PAID') {
      if (invoice.status !== 'PAID') invoice.status = 'PAID'; // guarded, replay no-ops
    } else {
      invoice.status = snap.status;
    }
    return repo.save(invoice);
  }

  /** Find-or-create the payment row for this charge attempt (Rule 2b). */
  private async upsertPayment(
    manager: EntityManager,
    sub: Subscription,
    providerKey: ProviderKey,
    invoice: Invoice,
    snap: ProviderInvoiceSnapshot,
    fallbackStatus: 'PAID' | 'FAILED',
  ): Promise<Payment> {
    const repo = manager.getRepository(Payment);
    const status = snap.paymentStatus ?? fallbackStatus;
    const idempotencyKey = snap.providerPaymentId
      ? `${providerKey}:${snap.providerPaymentId}`
      : `${providerKey}:${snap.providerInvoiceId}:${status}`;

    const existing = await repo.findOne({ where: { idempotencyKey } });
    if (existing) {
      if (existing.status !== status) {
        existing.status = status;
        return repo.save(existing);
      }
      return existing;
    }

    const attemptCount = await repo.count({ where: { invoiceId: invoice.id } });
    const payment = repo.create({
      invoiceId: invoice.id,
      userId: sub.userId,
      provider: providerKey,
      providerPaymentId: snap.providerPaymentId,
      status,
      amountMinor: snap.amountMinor,
      currency: snap.currency,
      attemptNo: attemptCount + 1,
      idempotencyKey,
    });
    return repo.save(payment);
  }
}
