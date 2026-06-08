import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface AuthSliceState {
  token: string | null;
}

interface RootStateLike {
  auth: AuthSliceState;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootStateLike).auth?.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
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
  ],
  endpoints: () => ({}),
});
