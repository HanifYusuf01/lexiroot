import { api } from './api';
import type { AuthUser } from '../store/slices/authSlice';
import type {
  CountryCode,
  LanguageCode,
  LearningLevel,
  LearningReason,
} from '@lexiroot/shared';

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface SignupBody {
  email: string;
  displayName: string;
  password: string;
  language?: LanguageCode;
  level?: LearningLevel;
  reason?: LearningReason;
  country?: CountryCode;
}

interface UpdateMeBody {
  displayName?: string;
  email?: string;
  language?: LanguageCode;
  level?: LearningLevel;
  reason?: LearningReason;
  country?: CountryCode;
  phone?: string;
  avatarUrl?: string;
}

interface ChangePasswordBody {
  currentPassword: string;
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

interface LoginBody {
  email: string;
  password: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    signup: build.mutation<AuthResponse, SignupBody>({
      query: (body) => ({ url: '/auth/signup', method: 'POST', body }),
    }),
    login: build.mutation<AuthResponse, LoginBody>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    verifyEmail: build.mutation<AuthResponse, { token: string }>({
      query: (body) => ({ url: '/auth/verify-email', method: 'POST', body }),
    }),
    resendVerification: build.mutation<void, { email: string }>({
      query: (body) => ({ url: '/auth/resend-verification', method: 'POST', body }),
    }),
    requestPasswordReset: build.mutation<void, { email: string }>({
      query: (body) => ({ url: '/auth/request-password-reset', method: 'POST', body }),
    }),
    resetPassword: build.mutation<void, { token: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    me: build.query<AuthUser, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    updateMe: build.mutation<AuthUser, UpdateMeBody>({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    changePassword: build.mutation<void, ChangePasswordBody>({
      query: (body) => ({ url: '/auth/me/password', method: 'POST', body }),
    }),
    signAvatarUpload: build.mutation<AvatarSignaturePayload, void>({
      query: () => ({ url: '/uploads/avatar/signature', method: 'POST' }),
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useSignAvatarUploadMutation,
} = authApi;
