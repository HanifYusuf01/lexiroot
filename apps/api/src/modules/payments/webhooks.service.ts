import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ProviderKey } from '@lexiroot/shared';
import { BillingService } from './billing.service';
import { WebhookEvent } from './entities/webhook-event.entity';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import type { NormalizedEvent } from './providers/payment-provider.interface';

/**
 * Inbound webhook orchestrator. Verifies the signature (in the provider), dedups
 * on the persisted `webhook_events` row (Rule 2a), then routes each normalized
 * event to the single billing convergence point. The raw payload is stored for
 * disputes/audit (Rule 3c). Processing is synchronous but light (re-fetch + a
 * short transaction); genuinely slow work (receipts/analytics) belongs in jobs.
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookEvent)
    private readonly events: Repository<WebhookEvent>,
    private readonly registry: PaymentProviderRegistry,
    private readonly billing: BillingService,
  ) {}

  /**
   * Verify + handle a provider webhook. Throws on a bad signature (→ 400) so
   * nothing is processed. Returns after the transition is applied; throwing on a
   * processing error lets the provider retry (the event row stays un-processed).
   */
  async handle(providerKey: ProviderKey, rawBody: Buffer, signature: string): Promise<void> {
    const provider = this.registry.get(providerKey);
    // Throws StripeSignatureVerificationError on tamper → caller maps to 400.
    const event = provider.verifyAndParseWebhook(rawBody, signature);

    const record = await this.claim(providerKey, event);
    if (!record) {
      this.logger.debug(`Duplicate ${providerKey} event ${event.providerEventId} skipped`);
      return;
    }

    try {
      const handled = await this.route(providerKey, event);
      record.status = handled ? 'processed' : 'skipped';
      record.processedAt = new Date();
      await this.events.save(record);
    } catch (err) {
      record.status = 'failed';
      record.error = err instanceof Error ? err.message : String(err);
      await this.events.save(record);
      // Rethrow so the provider retries; the 'failed' row is reprocessable.
      throw err;
    }
  }

  /**
   * Claim the event for processing. Returns the row to process, or null if it
   * was already processed/skipped (true duplicate). A prior 'failed'/'received'
   * row is returned so a retry can finish it.
   */
  private async claim(
    providerKey: ProviderKey,
    event: NormalizedEvent,
  ): Promise<WebhookEvent | null> {
    const existing = await this.events.findOne({
      where: { provider: providerKey, providerEventId: event.providerEventId },
    });
    if (existing) {
      if (existing.status === 'processed' || existing.status === 'skipped') return null;
      return existing;
    }
    try {
      return await this.events.save(
        this.events.create({
          provider: providerKey,
          providerEventId: event.providerEventId,
          type: event.type,
          payload: event.raw,
          status: 'received',
        }),
      );
    } catch {
      // Lost an insert race — another worker owns it. Treat as duplicate.
      return null;
    }
  }

  /** Route to the billing convergence point. Returns false when unhandled. */
  private async route(providerKey: ProviderKey, event: NormalizedEvent): Promise<boolean> {
    if (!event.objectId && event.kind !== 'unhandled') {
      this.logger.warn(`Event ${event.type} has no object id`);
      return false;
    }
    switch (event.kind) {
      case 'checkout.completed':
        await this.billing.linkCheckout(providerKey, event.objectId!);
        return true;
      case 'invoice.paid':
        await this.billing.applyInvoicePaid(providerKey, event.objectId!);
        return true;
      case 'invoice.payment_failed':
        await this.billing.applyInvoicePaymentFailed(providerKey, event.objectId!);
        return true;
      case 'subscription.updated':
      case 'subscription.deleted':
        await this.billing.syncSubscription(providerKey, event.objectId!);
        return true;
      case 'payment_method.updated':
        // Not mirrored in this slice; recorded for audit only.
        return false;
      default:
        return false;
    }
  }
}
