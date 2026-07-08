import type { AdminSubscription, PlanProviderSyncMap, ProviderKey } from '@lexiroot/shared';
import { api } from './api';

interface SyncProviderArgs {
  planId: string;
  provider?: ProviderKey;
}

interface PlanProviderPrice {
  id: string;
  planId: string;
  provider: ProviderKey;
  providerPriceId: string;
  amountMinor: number;
  currency: string;
}

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
    // Provisions the plan's provider price so it becomes purchasable.
    syncPlanProvider: build.mutation<PlanProviderPrice, SyncProviderArgs>({
      query: ({ planId, provider }) => ({
        url: `/admin/subscription-plans/${planId}/sync-provider`,
        method: 'POST',
        body: provider ? { provider } : {},
      }),
      invalidatesTags: ['SubscriptionPlan', 'PlanProviderSync'],
    }),
  }),
});

export const {
  useSubscriptionsQuery,
  usePlanProviderSyncQuery,
  useSyncPlanProviderMutation,
} = subscriptionsApi;
