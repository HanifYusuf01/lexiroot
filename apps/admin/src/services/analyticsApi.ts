import type { AnalyticsDashboard, AnalyticsOverview } from '@lexiroot/shared';
import { api } from './api';

interface DashboardArgs {
  from?: string;
  to?: string;
}

export const analyticsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAnalyticsOverview: build.query<AnalyticsOverview, void>({
      query: () => '/analytics/overview',
      providesTags: ['Analytics'],
    }),
    getAnalyticsDashboard: build.query<AnalyticsDashboard, DashboardArgs | void>({
      query: (args) => ({
        url: '/analytics/dashboard',
        params: { ...(args ?? {}) },
      }),
      providesTags: ['Analytics'],
    }),
  }),
});

export const { useGetAnalyticsOverviewQuery, useGetAnalyticsDashboardQuery } = analyticsApi;
