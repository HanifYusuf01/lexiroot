import type {
  ChangePlanRequest,
  ChangePlanResponse,
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
    // Moving an existing subscription between plans. Not checkout — checkout
    // 409s while a subscription is live, because it would open a second one.
    changePlan: build.mutation<ChangePlanResponse, ChangePlanRequest>({
      query: (body) => ({ url: '/subscriptions/change-plan', method: 'POST', body }),
      // An upgrade lands immediately, so both the plan shown and the features
      // gating the app have moved. A scheduled downgrade changes neither yet,
      // but does change what the manage screen must say.
      invalidatesTags: ['Subscription', 'User'],
    }),
    cancelSubscription: build.mutation<MySubscription, void>({
      query: () => ({ url: '/subscriptions/cancel', method: 'POST' }),
      // Entitlement changed → refresh both the subscription and the auth user.
      invalidatesTags: ['Subscription', 'User'],
    }),
    // Links a StoreKit purchase to the caller's pending Apple checkout — see
    // BillingService.linkAppleTransaction. Apple IAP has no hosted checkout to
    // bounce back from, so this is the client-driven equivalent of the
    // webhook-driven `linkCheckout` the other providers use.
    verifyAppleTransaction: build.mutation<MySubscription, { transactionId: string }>({
      query: (body) => ({ url: '/subscriptions/apple-iap/verify', method: 'POST', body }),
      invalidatesTags: ['Subscription', 'User'],
    }),
  }),
});

export const {
  useChangePlanMutation,
  useCreateCheckoutMutation,
  useMySubscriptionQuery,
  useLazyMySubscriptionQuery,
  useCancelSubscriptionMutation,
  useVerifyAppleTransactionMutation,
} = subscriptionsApi;
