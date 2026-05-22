import { api } from './api';
import type {
  CulturalContentBody,
  CulturalContentStatus,
  CulturalContentType,
  LanguageCode,
  LearningLevel,
} from '@lexiroot/shared';

export interface CulturalContentRow {
  id: string;
  type: CulturalContentType;
  language: LanguageCode;
  tier: LearningLevel;
  titleEnglish: string;
  titleTranslated: string;
  shortDescription: string;
  body: CulturalContentBody;
  coverImageUrl: string | null;
  audioUrl: string | null;
  audioFileName: string | null;
  status: CulturalContentStatus;
  views: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCulturalContent {
  items: CulturalContentRow[];
  page: number;
  limit: number;
  total: number;
}

export interface CulturalContentStats {
  total: number;
  folktales: number;
  proverbs: number;
  stories: number;
  mediaFiles: number;
  newThisMonth: number;
  newFolktalesThisMonth: number;
  newProverbsThisMonth: number;
  newStoriesThisMonth: number;
  newMediaFilesThisMonth: number;
}

export interface ListCulturalContentArgs {
  page?: number;
  limit?: number;
  search?: string;
  type?: CulturalContentType;
  language?: LanguageCode;
  tier?: LearningLevel;
  status?: CulturalContentStatus;
}

export interface CreateCulturalContentBody {
  type: CulturalContentType;
  language: LanguageCode;
  tier?: LearningLevel;
  titleEnglish: string;
  titleTranslated?: string;
  shortDescription?: string;
  body: CulturalContentBody;
  coverImageUrl?: string | null;
  audioUrl?: string | null;
  audioFileName?: string | null;
  status?: CulturalContentStatus;
}

export type UpdateCulturalContentBody = Partial<CreateCulturalContentBody> & { id: string };

export const culturalContentApi = api.injectEndpoints({
  endpoints: (build) => ({
    listCulturalContent: build.query<PaginatedCulturalContent, ListCulturalContentArgs>({
      query: (args) => ({ url: '/cultural-content', params: args }),
      providesTags: ['CulturalContent'],
    }),
    culturalContentStats: build.query<CulturalContentStats, void>({
      query: () => '/cultural-content/stats',
      providesTags: ['CulturalContentStats'],
    }),
    getCulturalContent: build.query<CulturalContentRow, string>({
      query: (id) => `/cultural-content/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'CulturalContent', id }],
    }),
    createCulturalContent: build.mutation<CulturalContentRow, CreateCulturalContentBody>({
      query: (body) => ({ url: '/cultural-content', method: 'POST', body }),
      invalidatesTags: ['CulturalContent', 'CulturalContentStats'],
    }),
    updateCulturalContent: build.mutation<CulturalContentRow, UpdateCulturalContentBody>({
      query: ({ id, ...body }) => ({
        url: `/cultural-content/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'CulturalContent',
        'CulturalContentStats',
        { type: 'CulturalContent', id: arg.id },
      ],
    }),
    archiveCulturalContent: build.mutation<CulturalContentRow, string>({
      query: (id) => ({ url: `/cultural-content/${id}/archive`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        'CulturalContent',
        'CulturalContentStats',
        { type: 'CulturalContent', id },
      ],
    }),
  }),
});

export const {
  useListCulturalContentQuery,
  useCulturalContentStatsQuery,
  useGetCulturalContentQuery,
  useCreateCulturalContentMutation,
  useUpdateCulturalContentMutation,
  useArchiveCulturalContentMutation,
} = culturalContentApi;
