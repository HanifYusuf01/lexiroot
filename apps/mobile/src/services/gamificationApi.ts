import type { LeaderboardPage, UserAchievement } from '@lexiroot/shared';
import { api } from './api';

interface LeaderboardArgs {
  page?: number;
  limit?: number;
}

export const gamificationApi = api.injectEndpoints({
  endpoints: (build) => ({
    getLeaderboard: build.query<LeaderboardPage, LeaderboardArgs | void>({
      query: (args) => ({
        url: '/gamification/leaderboard',
        params: { page: 1, limit: 50, ...(args ?? {}) },
      }),
      providesTags: ['Leaderboard'],
    }),
    getMyAchievements: build.query<UserAchievement[], void>({
      query: () => '/gamification/me/achievements',
      providesTags: ['Achievements'],
    }),
  }),
});

export const { useGetLeaderboardQuery, useGetMyAchievementsQuery } = gamificationApi;
