import type { AdminSubscription, ProviderKey } from '@lexiroot/shared';
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
    // Provisions the plan's provider price so it becomes purchasable.
    syncPlanProvider: build.mutation<PlanProviderPrice, SyncProviderArgs>({
      query: ({ planId, provider }) => ({
        url: `/admin/subscription-plans/${planId}/sync-provider`,
        method: 'POST',
        body: provider ? { provider } : {},
      }),
      invalidatesTags: ['SubscriptionPlan'],
    }),
  }),
});

export const { useSubscriptionsQuery, useSyncPlanProviderMutation } = subscriptionsApi;
