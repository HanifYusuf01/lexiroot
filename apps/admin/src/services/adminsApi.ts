import type {
  AdminAccount,
  AdminInvitation,
  AdminInvitationPreview,
  AdminRole,
  CreateAdminInvitation,
} from '@lexiroot/shared';
import { api } from './api';
import type { AdminUser } from '../store/slices/authSlice';

interface AcceptResponse {
  token: string;
  user: AdminUser;
}

export const adminsApi = api.injectEndpoints({
  endpoints: (build) => ({
    adminMembers: build.query<AdminAccount[], void>({
      query: () => '/admin/members',
      providesTags: ['AdminMember'],
    }),
    updateAdminRole: build.mutation<AdminAccount, { id: string; role: AdminRole }>({
      query: ({ id, role }) => ({
        url: `/admin/members/${id}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: ['AdminMember'],
    }),
    removeAdminMember: build.mutation<void, string>({
      query: (id) => ({ url: `/admin/members/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminMember'],
    }),

    adminInvitations: build.query<AdminInvitation[], void>({
      query: () => '/admin/invitations',
      providesTags: ['AdminInvitation'],
    }),
    createAdminInvitation: build.mutation<AdminInvitation, CreateAdminInvitation>({
      query: (body) => ({ url: '/admin/invitations', method: 'POST', body }),
      invalidatesTags: ['AdminInvitation'],
    }),
    resendAdminInvitation: build.mutation<AdminInvitation, string>({
      query: (id) => ({ url: `/admin/invitations/${id}/resend`, method: 'POST' }),
      invalidatesTags: ['AdminInvitation'],
    }),
    revokeAdminInvitation: build.mutation<void, string>({
      query: (id) => ({ url: `/admin/invitations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminInvitation'],
    }),

    // Public — used by the registration screen (no auth header needed).
    invitationPreview: build.query<AdminInvitationPreview, string>({
      query: (token) => `/admin/invitations/token/${token}`,
    }),
    acceptInvitation: build.mutation<AcceptResponse, { token: string; password: string }>({
      query: (body) => ({ url: '/admin/invitations/accept', method: 'POST', body }),
    }),
  }),
});

export const {
  useAdminMembersQuery,
  useUpdateAdminRoleMutation,
  useRemoveAdminMemberMutation,
  useAdminInvitationsQuery,
  useCreateAdminInvitationMutation,
  useResendAdminInvitationMutation,
  useRevokeAdminInvitationMutation,
  useInvitationPreviewQuery,
  useAcceptInvitationMutation,
} = adminsApi;
