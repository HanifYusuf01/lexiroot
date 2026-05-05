import { api } from './api';
import type { CountryCode, LanguageCode, LearningLevel, LearningReason } from '@lexiroot/shared';

export interface UserRow {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  emailVerifiedAt: string | null;
  language: LanguageCode | null;
  level: LearningLevel | null;
  learningReason: LearningReason | null;
  country: CountryCode | null;
  phone: string | null;
  xp: number;
  currentStreakDays: number;
  lessonsCompleted: number;
  lastActiveAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedUsers {
  items: UserRow[];
  page: number;
  limit: number;
  total: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
}

export type UserStatusFilter = 'active' | 'inactive';

export interface ListUsersArgs {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatusFilter;
}

export interface UpdateUserArgs {
  id: string;
  displayName?: string;
  role?: 'user' | 'admin';
  emailVerified?: boolean;
  language?: LanguageCode;
  level?: LearningLevel;
}

export const usersApi = api.injectEndpoints({
  endpoints: (build) => ({
    listUsers: build.query<PaginatedUsers, ListUsersArgs>({
      query: ({ page = 1, limit = 12, search, status }) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (search) params.set('search', search);
        if (status) params.set('status', status);
        return `/users?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((u) => ({ type: 'User' as const, id: u.id })),
              { type: 'User' as const, id: 'LIST' },
            ]
          : [{ type: 'User' as const, id: 'LIST' }],
    }),
    getUserStats: build.query<UserStats, void>({
      query: () => '/users/stats',
      providesTags: [{ type: 'User', id: 'STATS' }],
    }),
    getUser: build.query<UserRow, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
    updateUser: build.mutation<UserRow, UpdateUserArgs>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'User', id: 'STATS' },
      ],
    }),
    deleteUser: build.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'User', id: 'LIST' },
        { type: 'User', id: 'STATS' },
      ],
    }),
  }),
});

export const {
  useListUsersQuery,
  useGetUserStatsQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
