import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ProviderKey } from '@lexiroot/shared';
import type { PaymentsConfig } from '../../../config/payments.config';
import { AppleIapProvider } from './apple-iap.provider';
import type { PaymentProvider } from './payment-provider.interface';
import { PaystackProvider } from './paystack.provider';
import { StripeProvider } from './stripe.provider';

/**
 * Resolves a `PaymentProvider` by key. This is the single dispatch point that
 * keeps the rest of the app provider-agnostic — callers pass a `ProviderKey`
 * (from the request or the configured default) and never import a concrete
 * provider.
 */
@Injectable()
export class PaymentProviderRegistry {
  private readonly providers: Map<ProviderKey, PaymentProvider>;

  constructor(
    private readonly config: ConfigService,
    stripe: StripeProvider,
    paystack: PaystackProvider,
    appleIap: AppleIapProvider,
  ) {
    this.providers = new Map<ProviderKey, PaymentProvider>([
      [stripe.key, stripe],
      [paystack.key, paystack],
      [appleIap.key, appleIap],
    ]);
  }

  get defaultProviderKey(): ProviderKey {
    return this.config.getOrThrow<PaymentsConfig>('payments').defaultProvider;
  }

  get(key: ProviderKey): PaymentProvider {
    const provider = this.providers.get(key);
    if (!provider) throw new BadRequestException(`Unknown payment provider: ${key}`);
    return provider;
  }

  /** Resolve the request's provider, falling back to the configured default. */
  resolve(key?: ProviderKey | null): PaymentProvider {
    return this.get(key ?? this.defaultProviderKey);
  }
}
