import { api } from './api';
import type { LessonEntryInput, LessonEntryRow } from '@lexiroot/shared';

export const lessonEntriesApi = api.injectEndpoints({
  endpoints: (build) => ({
    listEntries: build.query<LessonEntryRow[], string>({
      query: (lessonId) => `/lessons/${lessonId}/entries`,
      providesTags: (_r, _e, lessonId) => [{ type: 'Lesson', id: `${lessonId}-entries` }],
    }),
    replaceEntries: build.mutation<
      LessonEntryRow[],
      { lessonId: string; entries: LessonEntryInput[] }
    >({
      query: ({ lessonId, entries }) => ({
        url: `/lessons/${lessonId}/entries`,
        method: 'PUT',
        body: { entries },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Lesson', id: `${arg.lessonId}-entries` },
        { type: 'Lesson', id: arg.lessonId },
      ],
    }),
  }),
});

export const { useListEntriesQuery, useReplaceEntriesMutation } = lessonEntriesApi;
