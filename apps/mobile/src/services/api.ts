import { createApi, fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import Constants from 'expo-constants';
import { authStorage } from './secureStorage';
import { clearCredentials } from '../store/slices/authSlice';

function deriveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:3000` : 'http://localhost:3000';
}

interface AuthSliceState {
  token: string | null;
}

interface RootStateLike {
  auth: AuthSliceState;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: deriveApiUrl(),
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootStateLike).auth?.token;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  apiCtx,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, apiCtx, extraOptions);
  if (result.error?.status === 401) {
    await authStorage.clear();
    apiCtx.dispatch(clearCredentials());
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Lesson', 'Language', 'Subscription', 'Settings'],
  endpoints: () => ({}),
});
