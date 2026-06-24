import type { PlanScope, SubscriptionPlan } from '@lexiroot/shared';
import { api } from './api';

export const subscriptionPlansApi = api.injectEndpoints({
  endpoints: (build) => ({
    subscriptionPlans: build.query<SubscriptionPlan[], PlanScope | void>({
      query: (scope) => ({
        url: '/subscription-plans',
        params: scope ? { scope } : undefined,
      }),
      providesTags: ['Subscription'],
    }),
  }),
});

export const { useSubscriptionPlansQuery } = subscriptionPlansApi;
