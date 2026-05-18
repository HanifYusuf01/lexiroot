import type { LessonCompletionResult, ProgressSummary } from '@lexiroot/shared';
import { api } from './api';

interface CompleteLessonArgs {
  lessonId: string;
  correctCount: number;
  totalCount: number;
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
  }),
});

export const { useGetProgressQuery, useCompleteLessonMutation } = progressApi;
