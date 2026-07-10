import { registerAs } from '@nestjs/config';
import type { ProviderKey } from '@lexiroot/shared';

/**
 * Typed payments configuration. Secrets come from the environment only — never
 * hardcoded (Rule 9a). Values are read lazily by providers so the API still
 * boots in dev without live keys; a provider only throws when actually used
 * without its key configured.
 */
export interface PaymentsConfig {
  /**
   * Last-resort provider when the per-country preference has nothing live. Null
   * (unset) means "use whatever is available" — there is no hardcoded default,
   * because the right provider depends on the user's country, not a global pick.
   */
  defaultProvider: ProviderKey | null;
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  paystack: {
    /** Same key verifies webhooks — Paystack has no separate webhook secret. */
    secretKey: string;
    /**
     * Optional currency override for plan creation (NGN, GHS, ZAR, USD, KES…).
     * When unset, Paystack creates plans in the account's own default currency —
     * so there is no country assumption baked in here. Set it only if your
     * account has several currencies enabled and you want a specific one.
     */
    currency: string | null;
  };
  /** Where Stripe Checkout redirects on success/cancel. */
  checkout: {
    successUrl: string;
    cancelUrl: string;
  };
  /** Days a PAST_DUE / CANCELED subscription retains access past period end. */
  graceDays: number;
}

export const paymentsConfig = registerAs(
  'payments',
  (): PaymentsConfig => ({
    defaultProvider: (process.env.PAYMENTS_DEFAULT_PROVIDER as ProviderKey) || null,
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY ?? '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    },
    paystack: {
      secretKey: process.env.PAYSTACK_SECRET_KEY ?? '',
      currency: process.env.PAYSTACK_CURRENCY?.toUpperCase() || null,
    },
    // Return pages live on the marketing website (apps/web). In prod set these
    // to the website domain, e.g. https://lexiroot.app/subscription/success.
    checkout: {
      successUrl:
        process.env.CHECKOUT_SUCCESS_URL ?? 'http://localhost:5174/subscription/success',
      cancelUrl: process.env.CHECKOUT_CANCEL_URL ?? 'http://localhost:5174/subscription/cancel',
    },
    graceDays: Number(process.env.SUBSCRIPTION_GRACE_DAYS ?? 3),
  }),
);
