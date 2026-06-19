import type {
  DurationBucket,
  ExerciseRow,
  LanguageCode,
  LearningLevel,
  LessonEntryRow,
  LessonMeta,
  LessonStatus,
  LessonType,
} from '@lexiroot/shared';
import { api } from './api';

export interface LessonRow {
  id: string;
  language: LanguageCode;
  tier: LearningLevel;
  level: number;
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

export interface ListLessonsArgs {
  page?: number;
  limit?: number;
  language?: LanguageCode;
  tier?: LearningLevel;
  level?: number;
  status?: LessonStatus;
}

// Downloaded lesson content must survive in the cache long enough to be read
// back offline, so we keep these entries far longer than the RTK Query default
// (60s). redux-persist writes whatever is cached to disk for cold-start reads.
const OFFLINE_KEEP_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const lessonsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listLessons: build.query<PaginatedLessons, ListLessonsArgs>({
      query: (args) => ({ url: '/lessons', params: { status: 'published', ...args } }),
      providesTags: ['Lesson'],
      keepUnusedDataFor: OFFLINE_KEEP_SECONDS,
    }),
    getLesson: build.query<LessonRow, string>({
      query: (id) => `/lessons/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Lesson', id }],
      keepUnusedDataFor: OFFLINE_KEEP_SECONDS,
    }),
    listEntries: build.query<LessonEntryRow[], string>({
      query: (lessonId) => `/lessons/${lessonId}/entries`,
      providesTags: (_r, _e, lessonId) => [{ type: 'Lesson', id: `${lessonId}-entries` }],
      keepUnusedDataFor: OFFLINE_KEEP_SECONDS,
    }),
    listExercises: build.query<ExerciseRow[], string>({
      query: (lessonId) => `/lessons/${lessonId}/exercises`,
      providesTags: (_r, _e, lessonId) => [{ type: 'Lesson', id: `${lessonId}-exercises` }],
      keepUnusedDataFor: OFFLINE_KEEP_SECONDS,
    }),
  }),
});

export const {
  useListLessonsQuery,
  useGetLessonQuery,
  useListEntriesQuery,
  useListExercisesQuery,
} = lessonsApi;
