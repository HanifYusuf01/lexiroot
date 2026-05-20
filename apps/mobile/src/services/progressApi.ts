import type {
  LessonCompletionResult,
  LessonProgressState,
  ProgressSummary,
} from '@lexiroot/shared';
import { api } from './api';

interface CompleteLessonArgs {
  lessonId: string;
  correctCount: number;
  totalCount: number;
}

interface UpsertLessonProgressArgs {
  tier: string;
  level: number;
  subIdx: number;
  subLessonId: string | null;
  stepKind: LessonProgressState['stepKind'];
  stepIndex: number;
  correctCount: number;
  xp: number;
}

interface ClearLessonProgressArgs {
  tier: string;
  level: number;
}

export const progressApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProgress: build.query<ProgressSummary, void>({
      query: () => '/me/progress',
      providesTags: ['Progress'],
    }),
    completeLesson: build.mutation<LessonCompletionResult, CompleteLessonArgs>({
      query: ({ lessonId, correctCount, totalCount }) => ({
        url: `/me/lessons/${lessonId}/complete`,
        method: 'POST',
        body: { correctCount, totalCount },
      }),
      invalidatesTags: ['Progress', 'Lesson'],
    }),
    getLessonProgress: build.query<LessonProgressState | null, void>({
      query: () => '/me/lesson-progress',
      providesTags: ['LessonProgress'],
    }),
    upsertLessonProgress: build.mutation<LessonProgressState, UpsertLessonProgressArgs>({
      query: (body) => ({
        url: '/me/lesson-progress',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['LessonProgress'],
    }),
    clearLessonProgress: build.mutation<void, ClearLessonProgressArgs>({
      query: ({ tier, level }) => ({
        url: `/me/lesson-progress/${tier}/${level}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LessonProgress'],
    }),
  }),
});

export const {
  useGetProgressQuery,
  useCompleteLessonMutation,
  useGetLessonProgressQuery,
  useUpsertLessonProgressMutation,
  useClearLessonProgressMutation,
} = progressApi;
