import type {
  AnalyticsDashboard,
  AnalyticsOverview,
  AnalyticsRevenueDetail,
} from '@lexiroot/shared';
import { api } from './api';

interface DashboardArgs {
  from?: string;
  to?: string;
}

export const analyticsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAnalyticsOverview: build.query<AnalyticsOverview, DashboardArgs | void>({
      query: (args) => ({
        url: '/analytics/overview',
        params: { ...(args ?? {}) },
      }),
      providesTags: ['Analytics'],
    }),
    getAnalyticsDashboard: build.query<AnalyticsDashboard, DashboardArgs | void>({
      query: (args) => ({
        url: '/analytics/dashboard',
        params: { ...(args ?? {}) },
      }),
      providesTags: ['Analytics'],
    }),
    getRevenueAnalytics: build.query<AnalyticsRevenueDetail, DashboardArgs | void>({
      query: (args) => ({
        url: '/analytics/revenue',
        params: { ...(args ?? {}) },
      }),
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetAnalyticsOverviewQuery,
  useGetAnalyticsDashboardQuery,
  useGetRevenueAnalyticsQuery,
} = analyticsApi;
