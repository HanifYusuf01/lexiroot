import type {
  AcceptFamilyInviteResult,
  FamilyInvitePreview,
  FamilyOverview,
} from '@lexiroot/shared';
import { api } from './api';

/**
 * Family plan seats. The subscription is shared; accounts are not — every seat
 * keeps its own language, level and progress, so nothing here touches learning
 * data.
 *
 * Seat changes alter entitlement, so mutations invalidate `Subscription` and
 * `User` alongside `Family` — otherwise a newly-added member's app would keep
 * showing the free tier until its next cold start.
 */
export const familyApi = api.injectEndpoints({
  endpoints: (build) => ({
    familyOverview: build.query<FamilyOverview, void>({
      query: () => '/subscriptions/family',
      providesTags: ['Family'],
    }),
    inviteFamilyMember: build.mutation<FamilyOverview, { email: string }>({
      query: (body) => ({ url: '/subscriptions/family/invites', method: 'POST', body }),
      invalidatesTags: ['Family'],
    }),
    // Unauthenticated: the accept screen renders before we know who the viewer
    // is — they may not have an account yet.
    familyInvitePreview: build.query<FamilyInvitePreview, { token: string }>({
      query: ({ token }) => `/family-invites/preview?token=${encodeURIComponent(token)}`,
    }),
    acceptFamilyInvite: build.mutation<AcceptFamilyInviteResult, { token: string }>({
      query: (body) => ({ url: '/subscriptions/family/invites/accept', method: 'POST', body }),
      invalidatesTags: ['Family', 'Subscription', 'User'],
    }),
    removeFamilySeat: build.mutation<FamilyOverview, { id: string }>({
      query: ({ id }) => ({ url: `/subscriptions/family/seats/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Family'],
    }),
    leaveFamilyPlan: build.mutation<void, void>({
      query: () => ({ url: '/subscriptions/family/membership', method: 'DELETE' }),
      invalidatesTags: ['Family', 'Subscription', 'User'],
    }),
  }),
});

export const {
  useFamilyOverviewQuery,
  useInviteFamilyMemberMutation,
  useFamilyInvitePreviewQuery,
  useAcceptFamilyInviteMutation,
  useRemoveFamilySeatMutation,
  useLeaveFamilyPlanMutation,
} = familyApi;
