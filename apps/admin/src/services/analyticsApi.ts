import type { AnalyticsOverview } from '@lexiroot/shared';
import { api } from './api';

export const analyticsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAnalyticsOverview: build.query<AnalyticsOverview, void>({
      query: () => '/analytics/overview',
      providesTags: ['Analytics'],
    }),
  }),
});

export const { useGetAnalyticsOverviewQuery } = analyticsApi;
