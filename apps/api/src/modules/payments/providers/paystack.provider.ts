import { Injectable, NotImplementedException } from '@nestjs/common';
import type { ProviderKey } from '@lexiroot/shared';
import type {
  CheckoutOutcome,
  CheckoutResult,
  CreateCheckoutInput,
  NormalizedEvent,
  PaymentProvider,
  ProviderInvoiceSnapshot,
  ProviderSubSnapshot,
  SyncPlanPriceInput,
  SyncPlanPriceResult,
} from './payment-provider.interface';

/**
 * Placeholder so the registry + wiring compile. Implement against Paystack's
 * subscription + transaction APIs when we go live in NGN markets. Every method
 * maps Paystack's vocabulary onto the neutral shapes, exactly like Stripe.
 */
@Injectable()
export class PaystackProvider implements PaymentProvider {
  readonly key: ProviderKey = 'paystack';

  private notImplemented(): never {
    throw new NotImplementedException('Paystack provider is not implemented yet');
  }

  createCheckout(_input: CreateCheckoutInput): Promise<CheckoutResult> {
    return this.notImplemented();
  }
  verifyAndParseWebhook(_rawBody: Buffer, _signature: string): NormalizedEvent {
    return this.notImplemented();
  }
  fetchSubscription(_id: string): Promise<ProviderSubSnapshot> {
    return this.notImplemented();
  }
  fetchInvoice(_id: string): Promise<ProviderInvoiceSnapshot> {
    return this.notImplemented();
  }
  fetchCheckoutOutcome(_sessionId: string): Promise<CheckoutOutcome> {
    return this.notImplemented();
  }
  cancelSubscription(_id: string, _atPeriodEnd: boolean): Promise<void> {
    return this.notImplemented();
  }
  syncPlanPrice(_input: SyncPlanPriceInput): Promise<SyncPlanPriceResult> {
    return this.notImplemented();
  }
}
