import { api } from './api';
import type { ExerciseInput, ExerciseRow } from '@lexiroot/shared';

export const exercisesApi = api.injectEndpoints({
  endpoints: (build) => ({
    listExercises: build.query<ExerciseRow[], string>({
      query: (lessonId) => `/lessons/${lessonId}/exercises`,
      providesTags: (_r, _e, lessonId) => [{ type: 'Lesson', id: `${lessonId}-exercises` }],
    }),
    replaceExercises: build.mutation<
      ExerciseRow[],
      { lessonId: string; exercises: ExerciseInput[] }
    >({
      query: ({ lessonId, exercises }) => ({
        url: `/lessons/${lessonId}/exercises`,
        method: 'PUT',
        body: { exercises },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Lesson', id: `${arg.lessonId}-exercises` },
        { type: 'Lesson', id: arg.lessonId },
      ],
    }),
  }),
});

export const { useListExercisesQuery, useReplaceExercisesMutation } = exercisesApi;
