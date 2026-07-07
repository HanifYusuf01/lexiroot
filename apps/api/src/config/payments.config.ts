import { registerAs } from '@nestjs/config';
import type { ProviderKey } from '@lexiroot/shared';

/**
 * Typed payments configuration. Secrets come from the environment only — never
 * hardcoded (Rule 9a). Values are read lazily by providers so the API still
 * boots in dev without live keys; a provider only throws when actually used
 * without its key configured.
 */
export interface PaymentsConfig {
  defaultProvider: ProviderKey;
  stripe: {
    secretKey: string;
    webhookSecret: string;
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
    defaultProvider: (process.env.PAYMENTS_DEFAULT_PROVIDER as ProviderKey) || 'stripe',
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY ?? '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
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
