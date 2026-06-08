import type {
  CreateTeachingLanguage,
  TeachingLanguage,
  UpdateTeachingLanguage,
} from '@lexiroot/shared';
import { api } from './api';

export const languagesApi = api.injectEndpoints({
  endpoints: (build) => ({
    teachingLanguages: build.query<TeachingLanguage[], void>({
      query: () => '/admin/languages',
      providesTags: ['Language'],
    }),
    createTeachingLanguage: build.mutation<TeachingLanguage, CreateTeachingLanguage>({
      query: (body) => ({ url: '/admin/languages', method: 'POST', body }),
      invalidatesTags: ['Language'],
    }),
    updateTeachingLanguage: build.mutation<
      TeachingLanguage,
      { id: string; changes: UpdateTeachingLanguage }
    >({
      query: ({ id, changes }) => ({
        url: `/admin/languages/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: ['Language'],
    }),
    deleteTeachingLanguage: build.mutation<void, string>({
      query: (id) => ({ url: `/admin/languages/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Language'],
    }),
  }),
});

export const {
  useTeachingLanguagesQuery,
  useCreateTeachingLanguageMutation,
  useUpdateTeachingLanguageMutation,
  useDeleteTeachingLanguageMutation,
} = languagesApi;
