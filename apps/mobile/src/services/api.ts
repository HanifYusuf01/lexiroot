import { createApi, fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { REHYDRATE } from 'redux-persist';
import Constants from 'expo-constants';
import { authStorage } from './secureStorage';
import { clearCredentials } from '../store/slices/authSlice';
import { selectIsOnline } from '../store/slices/networkSlice';
import { enqueue } from '../store/slices/outboxSlice';
import { syntheticOfflineResponse } from './offlineResponses';

export function getApiBaseUrl(): string {
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
  baseUrl: getApiBaseUrl(),
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
  // Read the token we're about to send, before the request can race with a
  // clearCredentials() from another in-flight query.
  const tokenSent = Boolean((apiCtx.getState() as RootStateLike).auth?.token);

  const result = await rawBaseQuery(args, apiCtx, extraOptions);

  // Only a *rejected token* means the session is dead. A 401 on a request that
  // carried no token just means we weren't authenticated yet — that happens on a
  // cold start, before useAuthBootstrap has read SecureStore, and it must not
  // destroy the stored session. (Signing back in then loses entitlement state.)
  if (result.error?.status === 401 && tokenSent) {
    await authStorage.clear();
    apiCtx.dispatch(clearCredentials());
  }
  return result;
};

function normalizeArgs(args: string | FetchArgs): { url: string; method: string; body?: unknown } {
  if (typeof args === 'string') return { url: args, method: 'GET' };
  return { url: args.url, method: (args.method ?? 'GET').toUpperCase(), body: args.body };
}

function isNetworkError(error?: FetchBaseQueryError): boolean {
  return error?.status === 'FETCH_ERROR' || error?.status === 'TIMEOUT_ERROR';
}

/**
 * Wraps the base query so that write requests (anything other than GET) made
 * while offline — or that fail with a network error — are pushed onto the
 * outbox and answered with a synthetic success. The queued request is replayed
 * by `flushOutbox` on reconnect. Reads fall through unchanged: when offline the
 * persisted RTK Query cache continues to serve the last-known data.
 */
const offlineAwareBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  apiCtx,
  extraOptions,
) => {
  const { url, method, body } = normalizeArgs(args);
  const isWrite = method !== 'GET';
  const online = selectIsOnline(apiCtx.getState() as Parameters<typeof selectIsOnline>[0]);

  // Known offline: don't even attempt the network — queue immediately.
  if (isWrite && !online) {
    apiCtx.dispatch(enqueue({ url, method, body }));
    return { data: syntheticOfflineResponse(url, method, body) };
  }

  const result = await baseQueryWithReauth(args, apiCtx, extraOptions);

  // Thought we were online but the request failed at the network layer: queue
  // it so the change isn't lost, and let the UI proceed optimistically.
  if (isWrite && isNetworkError(result.error)) {
    apiCtx.dispatch(enqueue({ url, method, body }));
    return { data: syntheticOfflineResponse(url, method, body) };
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: offlineAwareBaseQuery,
  // Absorb the persisted RTK Query cache when redux-persist rehydrates, so
  // previously-fetched lessons are immediately available offline on cold start.
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE) {
      const payload = (action as { payload?: Record<string, unknown> }).payload;
      return payload?.[reducerPath] as never;
    }
    return undefined;
  },
  tagTypes: [
    'User',
    'Lesson',
    'Language',
    'Subscription',
    'Settings',
    'Progress',
    'LessonProgress',
    'CulturalContent',
    'Leaderboard',
    'Achievements',
  ],
  endpoints: () => ({}),
});
