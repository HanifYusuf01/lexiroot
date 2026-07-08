import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { clearCredentials } from '../store/slices/authSlice';
import { adminAuthStorage } from '../utils/storage';

interface AuthSliceState {
  token: string | null;
}

interface RootStateLike {
  auth: AuthSliceState;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootStateLike).auth?.token;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

/**
 * Wraps the base query so an expired/invalid JWT (401) logs the admin out
 * instead of surfacing a bare "Unauthorized" error mid-action. Clearing the
 * token makes ProtectedRoute redirect to /login on the next render. We only
 * react when a token was actually present so a failed login attempt (which also
 * returns 401) doesn't get treated as a session expiry.
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, apiCtx, extraOptions) => {
  const result = await rawBaseQuery(args, apiCtx, extraOptions);
  if (result.error?.status === 401) {
    const hadToken = (apiCtx.getState() as RootStateLike).auth?.token;
    if (hadToken) {
      adminAuthStorage.clear();
      apiCtx.dispatch(clearCredentials());
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Lesson',
    'LessonStats',
    'Category',
    'Language',
    'Subscription',
    'Analytics',
    'CulturalContent',
    'CulturalContentStats',
    'GamificationStats',
    'TopEarners',
    'PlatformSettings',
    'SubscriptionPlan',
    'PlanProviderSync',
    'AdminMember',
    'AdminInvitation',
  ],
  endpoints: () => ({}),
});
