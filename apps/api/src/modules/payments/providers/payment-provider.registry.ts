import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ProviderKey } from '@lexiroot/shared';
import type { PaymentsConfig } from '../../../config/payments.config';
import { AppleIapProvider } from './apple-iap.provider';
import type { PaymentProvider } from './payment-provider.interface';
import { PaystackProvider } from './paystack.provider';
import { providerPreference, type ProviderPreferenceInput } from './provider-preference';
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

  /** Configured last-resort provider, or null when unset (→ first available). */
  get defaultProviderKey(): ProviderKey | null {
    return this.config.getOrThrow<PaymentsConfig>('payments').defaultProvider;
  }

  get(key: ProviderKey): PaymentProvider {
    const provider = this.providers.get(key);
    if (!provider) throw new BadRequestException(`Unknown payment provider: ${key}`);
    return provider;
  }

  /**
   * Resolve a provider: the requested key, else the configured default, else the
   * first available provider. There is no hardcoded default — nothing here
   * assumes Stripe.
   */
  resolve(key?: ProviderKey | null): PaymentProvider {
    const chosen = key ?? this.defaultProviderKey;
    if (chosen) return this.get(chosen);
    const [first] = this.availableProviders();
    if (!first) throw new ServiceUnavailableException('No payment provider is available');
    return first;
  }

  /** Every provider that can take a payment right now, in registration order. */
  availableProviders(): PaymentProvider[] {
    return [...this.providers.values()].filter((p) => p.available);
  }

  /**
   * The providers a checkout may bill through, best first. The client declares
   * its platform and we know the user's country; ordering policy lives in
   * `providerPreference`, and we drop anything not actually live so an
   * unimplemented stub can never reach a user. The caller picks the first
   * candidate it can honour (e.g. the first with a synced price).
   *
   * `requested` is an explicit override (admin/testing) — honoured, but only if
   * that provider is live, so nobody can force a 501 stub from the outside.
   *
   * Always returns at least one key, or throws if nothing is configured.
   */
  checkoutCandidates(
    input: ProviderPreferenceInput & { requested?: ProviderKey | null },
  ): ProviderKey[] {
    if (input.requested) {
      const provider = this.get(input.requested);
      if (!provider.available) {
        throw new ServiceUnavailableException(`Payment provider ${input.requested} is not available`);
      }
      return [provider.key];
    }

    const candidates = providerPreference(input).filter(
      (key) => this.providers.get(key)?.available,
    );
    if (candidates.length > 0) return candidates;

    // Nothing the policy wants is live (e.g. a Paystack-market user but Paystack
    // isn't configured) — fall back to the configured default if set, otherwise
    // to any available provider, so a gap can't strand a paying user.
    const fallback = this.resolve();
    return [fallback.key];
  }
}
