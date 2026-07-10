import type { AdminSubscription, PlanProviderSyncMap, PlanSyncResult } from '@lexiroot/shared';
import { api } from './api';

export const subscriptionsApi = api.injectEndpoints({
  endpoints: (build) => ({
    subscriptions: build.query<AdminSubscription[], void>({
      query: () => '/admin/subscriptions',
      providesTags: ['Subscription'],
    }),
    // Which plans are purchasable via which live provider, keyed by plan id.
    planProviderSync: build.query<PlanProviderSyncMap, void>({
      query: () => '/admin/subscription-plans/provider-sync',
      providesTags: ['PlanProviderSync'],
    }),
    // Provisions the plan on every live provider at once, so it's purchasable
    // everywhere it should be. Returns one result per provider attempted.
    syncPlanToAll: build.mutation<PlanSyncResult[], string>({
      query: (planId) => ({
        url: `/admin/subscription-plans/${planId}/sync`,
        method: 'POST',
      }),
      invalidatesTags: ['SubscriptionPlan', 'PlanProviderSync'],
    }),
  }),
});

export const {
  useSubscriptionsQuery,
  usePlanProviderSyncQuery,
  useSyncPlanToAllMutation,
} = subscriptionsApi;
