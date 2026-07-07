import type {
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  SubscriptionSummary,
} from '@lexiroot/shared';
import { api } from './api';

export type MySubscription = SubscriptionSummary & { entitled: boolean };

/**
 * Subscription lifecycle endpoints. Checkout returns a hosted-checkout URL the
 * app opens in a browser; the real state lands via webhook, so the client polls
 * `mySubscription` (Rule 10a) rather than trusting the redirect.
 */
export const subscriptionsApi = api.injectEndpoints({
  endpoints: (build) => ({
    createCheckout: build.mutation<CreateCheckoutResponse, CreateCheckoutRequest>({
      query: (body) => ({ url: '/subscriptions/checkout', method: 'POST', body }),
    }),
    mySubscription: build.query<MySubscription, void>({
      query: () => '/subscriptions/me',
      providesTags: ['Subscription'],
    }),
    cancelSubscription: build.mutation<MySubscription, void>({
      query: () => ({ url: '/subscriptions/cancel', method: 'POST' }),
      // Entitlement changed → refresh both the subscription and the auth user.
      invalidatesTags: ['Subscription', 'User'],
    }),
  }),
});

export const {
  useCreateCheckoutMutation,
  useMySubscriptionQuery,
  useLazyMySubscriptionQuery,
  useCancelSubscriptionMutation,
} = subscriptionsApi;
