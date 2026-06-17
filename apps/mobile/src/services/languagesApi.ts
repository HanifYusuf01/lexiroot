import type { PublicLanguage } from '@lexiroot/shared';
import { api } from './api';

export const languagesApi = api.injectEndpoints({
  endpoints: (build) => ({
    languages: build.query<PublicLanguage[], void>({
      query: () => '/languages',
      providesTags: ['Language'],
    }),
  }),
});

export const { useLanguagesQuery } = languagesApi;
