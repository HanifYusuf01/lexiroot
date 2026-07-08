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
 * Placeholder so the registry + wiring compile. Apple IAP is receipt/notification
 * driven rather than hosted-checkout driven: `createCheckout` won't apply (the
 * purchase happens in StoreKit on device); instead the client sends a receipt we
 * verify, and App Store Server Notifications v2 map onto verifyAndParseWebhook.
 */
@Injectable()
export class AppleIapProvider implements PaymentProvider {
  readonly key: ProviderKey = 'apple_iap';

  /** Flip to a shared-secret check once StoreKit + ASSN v2 are implemented. */
  readonly available = false;

  private notImplemented(): never {
    throw new NotImplementedException('Apple IAP provider is not implemented yet');
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
