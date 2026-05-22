import type {
  CulturalContentBody,
  CulturalContentStatus,
  CulturalContentType,
  LanguageCode,
  LearningLevel,
} from '@lexiroot/shared';
import { api } from './api';

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

export interface ListCulturalContentArgs {
  page?: number;
  limit?: number;
  type?: CulturalContentType;
  language?: LanguageCode;
  tier?: LearningLevel;
}

export const culturalContentApi = api.injectEndpoints({
  endpoints: (build) => ({
    listCulturalContent: build.query<PaginatedCulturalContent, ListCulturalContentArgs>({
      query: (args) => ({
        url: '/cultural-content',
        params: { status: 'published', limit: 50, ...args },
      }),
      providesTags: ['CulturalContent'],
    }),
    getCulturalContent: build.query<CulturalContentRow, string>({
      query: (id) => `/cultural-content/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'CulturalContent', id }],
    }),
  }),
});

export const { useListCulturalContentQuery, useGetCulturalContentQuery } = culturalContentApi;
