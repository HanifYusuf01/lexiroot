import { api } from './api';
import type { AdminUser } from '../store/slices/authSlice';
import type { CountryCode } from '@lexiroot/shared';

interface AuthResponse {
  token: string;
  user: AdminUser;
}

export interface UpdateMeBody {
  displayName?: string;
  email?: string;
  country?: CountryCode;
  avatarUrl?: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface RequestPasswordResetBody {
  email: string;
}

export interface ResetPasswordBody {
  email: string;
  code: string;
  newPassword: string;
}

export interface AvatarSignaturePayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    me: build.query<AdminUser, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    updateMe: build.mutation<AdminUser, UpdateMeBody>({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    changePassword: build.mutation<void, ChangePasswordBody>({
      query: (body) => ({ url: '/auth/me/password', method: 'POST', body }),
    }),
    requestPasswordReset: build.mutation<void, RequestPasswordResetBody>({
      query: (body) => ({ url: '/auth/request-password-reset', method: 'POST', body }),
    }),
    resetPassword: build.mutation<void, ResetPasswordBody>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    signAvatarUpload: build.mutation<AvatarSignaturePayload, void>({
      query: () => ({ url: '/uploads/avatar/signature', method: 'POST' }),
    }),
  }),
});

export const {
  useLoginMutation,
  useMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useSignAvatarUploadMutation,
} = authApi;
