import type {
  FamilyLeaderboardResponse,
  LeaderboardQuery,
  LeaderboardResponse,
} from '@lexiroot/shared';
import { api } from './api';

/**
 * The weekly leaderboard. Every figure — Root Points, rank, mastery, league —
 * is computed by the API; nothing here calculates a score.
 *
 * Standings move whenever a lesson is completed, so the board is tagged
 * alongside `Progress`: finishing a lesson invalidates both and the ranking
 * refreshes without the screen having to poll.
 */
export const leaderboardApi = api.injectEndpoints({
  endpoints: (build) => ({
    leaderboard: build.query<LeaderboardResponse, LeaderboardQuery | void>({
      query: (args) => ({ url: '/leaderboard', params: { ...(args ?? {}) } }),
      providesTags: ['Leaderboard'],
    }),
    familyLeaderboard: build.query<FamilyLeaderboardResponse, void>({
      query: () => '/leaderboard/family',
      providesTags: ['Leaderboard'],
    }),
    setLeaderboardOptOut: build.mutation<{ optedOut: boolean }, { optedOut: boolean }>({
      query: (body) => ({ url: '/leaderboard/opt-out', method: 'PATCH', body }),
      invalidatesTags: ['Leaderboard'],
    }),
  }),
});

export const {
  useLeaderboardQuery,
  useFamilyLeaderboardQuery,
  useSetLeaderboardOptOutMutation,
} = leaderboardApi;
