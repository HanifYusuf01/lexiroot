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
 * 2. **Region.** Nigeria routes to Paystack, which charges in NGN via local
 *    acquiring; every other country routes to Stripe and is charged in USD.
 *    Paystack serves other African markets too, but each needs its own Paystack
 *    account, local entity and per-currency prices — whereas Stripe already
 *    accepts cards from those countries in USD. So Paystack stays scoped to the
 *    one market where the local rails actually earn their keep. Neither provider
 *    is a global default — the country decides, and if the chosen provider isn't
 *    configured the registry falls back to whatever is live.
 */

/**
 * The only country billed through Paystack. Keep this in step with
 * `COUNTRY_CURRENCY` in shared constants: a country routes to Paystack only if
 * we also price it in that country's local currency.
 */
const PAYSTACK_COUNTRY: CountryCode = 'NG';

/** The card processor for a country. Paystack in Nigeria, Stripe everywhere else. */
function cardProviders(country: CountryCode | null): ProviderKey[] {
  return country === PAYSTACK_COUNTRY ? ['paystack'] : ['stripe'];
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
