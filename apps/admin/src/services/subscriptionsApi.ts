import type {
  AdminSubscription,
  PlanProviderSyncMap,
  PlanSyncResult,
  ProviderKey,
} from '@lexiroot/shared';
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
    // Targeted single-provider sync. The only path for Apple IAP: its product id
    // is created manually in App Store Connect, so it comes from the admin here
    // rather than being minted by the provider like Stripe/Paystack.
    syncPlanToProvider: build.mutation<
      void,
      { planId: string; provider: ProviderKey; providerProductId?: string }
    >({
      query: ({ planId, ...body }) => ({
        url: `/admin/subscription-plans/${planId}/sync-provider`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SubscriptionPlan', 'PlanProviderSync'],
    }),
  }),
});

export const {
  useSubscriptionsQuery,
  usePlanProviderSyncQuery,
  useSyncPlanToAllMutation,
  useSyncPlanToProviderMutation,
} = subscriptionsApi;
