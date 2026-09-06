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
/**
 * Writes that may be queued and replayed after a reconnect.
 *
 * Deliberately an allowlist. The outbox was built for learning progress, whose
 * replays are safe by construction — completion dedupes on (user, lesson),
 * progress is an upsert, clearing is a DELETE — but it was catching *every*
 * non-GET, including ones where a silent replay is the wrong answer entirely:
 * cancelling a subscription the learner then decided to keep, emailing a family
 * invitation the owner abandoned, revoking somebody's seat, opening a checkout.
 *
 * Everything not listed here fails normally when offline, so the person is told
 * it didn't happen instead of being quietly promised it later.
 */
const QUEUEABLE_WRITES: RegExp[] = [
  /^\/me\/lessons\/[^/]+\/complete$/,
  /^\/me\/lesson-progress(\/|$)/,
];

function isQueueableWrite(url: string): boolean {
  const path = url.split('?')[0];
  return QUEUEABLE_WRITES.some((pattern) => pattern.test(path));
}

const offlineAwareBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  apiCtx,
  extraOptions,
) => {
  const { url, method, body } = normalizeArgs(args);
  const isWrite = method !== 'GET';
  // Only learning writes are safe to replay unattended — see QUEUEABLE_WRITES.
  const queueable = isWrite && isQueueableWrite(url);
  const online = selectIsOnline(apiCtx.getState() as Parameters<typeof selectIsOnline>[0]);

  // Known offline: don't even attempt the network — queue immediately.
  if (queueable && !online) {
    apiCtx.dispatch(enqueue({ url, method, body }));
    return { data: syntheticOfflineResponse(url, method, body) };
  }

  const result = await baseQueryWithReauth(args, apiCtx, extraOptions);

  // Thought we were online but the request failed at the network layer: queue
  // it so the change isn't lost, and let the UI proceed optimistically.
  if (queueable && isNetworkError(result.error)) {
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
  /**
   * Absorb the persisted RTK Query cache on rehydrate, so previously-fetched
   * lessons are available offline on a cold start.
   *
   * Entries are filtered to endpoints this build actually has. A persisted
   * cache outlives the code that wrote it: an endpoint renamed or removed in a
   * new release leaves rows behind, and RTK then reads
   * `"serializeQueryArgs" in endpointDefinition` against an `undefined`
   * definition — which throws `right operand of 'in' is not an object` and, in
   * a release build, takes the screen down. It surfaces at whatever moment
   * rehydration touches the stale row, which is why it looked random.
   */
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type !== REHYDRATE) return undefined;
    const payload = (action as { payload?: Record<string, unknown> }).payload;
    const slice = payload?.[reducerPath] as
      | {
          queries?: Record<string, { endpointName?: string } | undefined>;
          mutations?: Record<string, { endpointName?: string } | undefined>;
        }
      | undefined;
    if (!slice) return undefined;

    // `api` is initialised by the time this callback runs.
    const known = new Set(Object.keys(api.endpoints ?? {}));
    const keepKnown = <T extends { endpointName?: string } | undefined>(
      entries: Record<string, T> | undefined,
    ): Record<string, T> =>
      Object.fromEntries(
        Object.entries(entries ?? {}).filter(
          ([, entry]) => !!entry?.endpointName && known.has(entry.endpointName),
        ),
      ) as Record<string, T>;

    return {
      ...slice,
      queries: keepKnown(slice.queries),
      mutations: keepKnown(slice.mutations),
    } as never;
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
    'Friends',
    'Achievements',
    'Family',
  ],
  endpoints: () => ({}),
});
