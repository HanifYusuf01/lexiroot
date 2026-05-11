import { api } from './api';
import type {
  DurationBucket,
  LanguageCode,
  LearningLevel,
  LessonMeta,
  LessonStatus,
  LessonType,
} from '@lexiroot/shared';

export interface LessonRow {
  id: string;
  language: LanguageCode;
  level: LearningLevel;
  category: { id: string; name: string; slug: string } | null;
  title: string;
  slug: string;
  shortDescription: string;
  estimatedDuration: DurationBucket | null;
  xpReward: number;
  orderInUnit: number;
  type: LessonType;
  speechRequired: boolean;
  offlineAvailable: boolean;
  status: LessonStatus;
  meta: LessonMeta;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedLessons {
  items: LessonRow[];
  page: number;
  limit: number;
  total: number;
}

export interface LessonStats {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  newThisMonth: number;
}

export interface ListLessonsArgs {
  page?: number;
  limit?: number;
  search?: string;
  language?: LanguageCode;
  level?: LearningLevel;
  status?: LessonStatus;
}

export interface CreateLessonBody {
  language: LanguageCode;
  level: LearningLevel;
  categoryId: string;
  title: string;
  shortDescription?: string;
  estimatedDuration?: DurationBucket;
  xpReward?: number;
  orderInUnit?: number;
  type: LessonType;
  speechRequired?: boolean;
  offlineAvailable?: boolean;
  status?: LessonStatus;
  meta?: LessonMeta;
}

export type UpdateLessonBody = Partial<CreateLessonBody> & { id: string };

export const lessonsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listLessons: build.query<PaginatedLessons, ListLessonsArgs>({
      query: (args) => ({ url: '/lessons', params: args }),
      providesTags: ['Lesson'],
    }),
    lessonStats: build.query<LessonStats, void>({
      query: () => '/lessons/stats',
      providesTags: ['LessonStats'],
    }),
    getLesson: build.query<LessonRow, string>({
      query: (id) => `/lessons/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Lesson', id }],
    }),
    createLesson: build.mutation<LessonRow, CreateLessonBody>({
      query: (body) => ({ url: '/lessons', method: 'POST', body }),
      invalidatesTags: ['Lesson', 'LessonStats'],
    }),
    updateLesson: build.mutation<LessonRow, UpdateLessonBody>({
      query: ({ id, ...body }) => ({ url: `/lessons/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, arg) => ['Lesson', 'LessonStats', { type: 'Lesson', id: arg.id }],
    }),
    archiveLesson: build.mutation<LessonRow, string>({
      query: (id) => ({ url: `/lessons/${id}/archive`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => ['Lesson', 'LessonStats', { type: 'Lesson', id }],
    }),
  }),
});

export const {
  useListLessonsQuery,
  useLessonStatsQuery,
  useGetLessonQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useArchiveLessonMutation,
} = lessonsApi;
