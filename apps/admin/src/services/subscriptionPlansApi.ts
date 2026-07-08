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
      // A new plan starts unsynced — refresh the sync map so the card says so.
      invalidatesTags: ['SubscriptionPlan', 'PlanProviderSync'],
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
      // Editing price/name/total is exactly what pushes a plan `out_of_date`
      // against its provider price — the sync map must be refetched.
      invalidatesTags: ['SubscriptionPlan', 'PlanProviderSync'],
    }),
    // 409 when learners are still subscribed — the DB refuses the delete.
    deleteSubscriptionPlan: build.mutation<void, string>({
      query: (id) => ({ url: `/admin/subscription-plans/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SubscriptionPlan', 'PlanProviderSync'],
    }),
  }),
});

export const {
  useSubscriptionPlansQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
} = subscriptionPlansApi;
