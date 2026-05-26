import type { GamificationStats, TopXpEarnersPage } from '@lexiroot/shared';
import { api } from './api';

interface TopEarnersArgs {
  page?: number;
  limit?: number;
}

export const gamificationApi = api.injectEndpoints({
  endpoints: (build) => ({
    gamificationStats: build.query<GamificationStats, void>({
      query: () => '/admin/gamification/stats',
      providesTags: ['GamificationStats'],
    }),
    topEarners: build.query<TopXpEarnersPage, TopEarnersArgs | void>({
      query: (args) => ({
        url: '/admin/gamification/top-earners',
        params: { page: 1, limit: 14, ...(args ?? {}) },
      }),
      providesTags: ['TopEarners'],
    }),
  }),
});

export const { useGamificationStatsQuery, useTopEarnersQuery } = gamificationApi;
