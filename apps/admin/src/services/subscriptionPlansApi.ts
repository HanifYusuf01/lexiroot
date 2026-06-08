import type { PlanScope, SubscriptionPlan, UpdateSubscriptionPlan } from '@lexiroot/shared';
import { api } from './api';

export const subscriptionPlansApi = api.injectEndpoints({
  endpoints: (build) => ({
    subscriptionPlans: build.query<SubscriptionPlan[], PlanScope | void>({
      query: (scope) => ({
        url: '/admin/subscription-plans',
        params: scope ? { scope } : undefined,
      }),
      providesTags: ['SubscriptionPlan'],
    }),
    updateSubscriptionPlan: build.mutation<
      SubscriptionPlan,
      { id: string; changes: UpdateSubscriptionPlan }
    >({
      query: ({ id, changes }) => ({
        url: `/admin/subscription-plans/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: ['SubscriptionPlan'],
    }),
  }),
});

export const { useSubscriptionPlansQuery, useUpdateSubscriptionPlanMutation } = subscriptionPlansApi;
