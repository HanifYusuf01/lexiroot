import type { ClientPlatform, CountryCode, ProviderKey } from '@lexiroot/shared';

/**
 * Which provider *should* take the payment, as an ordered preference list. The
 * registry walks it and picks the first one that is actually live, so this file
 * encodes policy only — it never needs to know what's implemented.
 *
 * Two rules drive the ordering:
 *
 * 1. **Platform.** Apple requires digital subscriptions consumed inside an iOS
 *    app to be sold through In-App Purchase (App Store Review Guideline 3.1.1).
 *    So on iOS, Apple IAP outranks every card processor. This is not a user
 *    choice, which is why it isn't one.
 * 2. **Region.** Card payments route to whoever clears the user's cards best:
 *    Paystack across its African markets, Stripe everywhere else.
 */

/** Markets where Paystack is the better card acquirer than Stripe. */
const PAYSTACK_COUNTRIES: readonly CountryCode[] = ['NG', 'GH', 'ZA', 'KE', 'CI', 'EG'];

/** Card processors for a country, best first. */
function cardProviders(country: CountryCode | null): ProviderKey[] {
  return country && PAYSTACK_COUNTRIES.includes(country)
    ? ['paystack', 'stripe']
    : ['stripe'];
}

export interface ProviderPreferenceInput {
  /** Undefined for callers that don't declare one (treated as a card platform). */
  platform?: ClientPlatform | null;
  /** The user's country, from their profile. Null → assume non-Paystack market. */
  country?: CountryCode | null;
}

/**
 * Ordered provider preferences for a checkout, most-preferred first. Always
 * returns at least one entry.
 */
export function providerPreference({
  platform,
  country = null,
}: ProviderPreferenceInput): ProviderKey[] {
  const cards = cardProviders(country);
  // On iOS, IAP first — but keep the card processors as fallbacks so checkout
  // still works before Apple IAP ships.
  return platform === 'ios' ? ['apple_iap', ...cards] : cards;
}
