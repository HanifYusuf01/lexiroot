import type {
  CreateSubscriptionPlan,
  PlanScope,
  SubscriptionPlan,
  UpdateSubscriptionPlan,
} from '@lexiroot/shared';
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
    createSubscriptionPlan: build.mutation<SubscriptionPlan, CreateSubscriptionPlan>({
      query: (body) => ({ url: '/admin/subscription-plans', method: 'POST', body }),
      invalidatesTags: ['SubscriptionPlan'],
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

export const {
  useSubscriptionPlansQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
} = subscriptionPlansApi;
