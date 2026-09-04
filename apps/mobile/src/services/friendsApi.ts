import type {
  FriendInvitePreview,
  FriendsOverview,
  FriendsLeaderboardResponse,
} from '@lexiroot/shared';
import { api } from './api';

/**
 * Friends and friend invitations.
 *
 * Every mutation invalidates `Leaderboard` as well as `Friends`: adding or
 * removing someone changes who is on the board, and a stale ranking after
 * accepting an invitation is the first thing anyone would notice.
 */
export const friendsApi = api.injectEndpoints({
  endpoints: (build) => ({
    friends: build.query<FriendsOverview, void>({
      query: () => '/friends',
      providesTags: ['Friends'],
    }),
    friendsLeaderboard: build.query<FriendsLeaderboardResponse, void>({
      query: () => '/leaderboard/friends',
      providesTags: ['Leaderboard', 'Friends'],
    }),
    inviteFriend: build.mutation<FriendsOverview, { email: string }>({
      query: (body) => ({ url: '/friends/invites', method: 'POST', body }),
      invalidatesTags: ['Friends'],
    }),
    // Unauthenticated: the accept screen renders before we know who is looking.
    friendInvitePreview: build.query<FriendInvitePreview, { token: string }>({
      query: ({ token }) => `/friend-invites/preview?token=${encodeURIComponent(token)}`,
    }),
    acceptFriendInvite: build.mutation<FriendsOverview, { token: string }>({
      query: (body) => ({ url: '/friends/invites/accept', method: 'POST', body }),
      invalidatesTags: ['Friends', 'Leaderboard'],
    }),
    removeFriend: build.mutation<FriendsOverview, { id: string }>({
      query: ({ id }) => ({ url: `/friends/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Friends', 'Leaderboard'],
    }),
  }),
});

export const {
  useFriendsQuery,
  useFriendsLeaderboardQuery,
  useInviteFriendMutation,
  useFriendInvitePreviewQuery,
  useAcceptFriendInviteMutation,
  useRemoveFriendMutation,
} = friendsApi;
