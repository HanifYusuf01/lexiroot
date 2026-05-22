import type { LanguageCode, LearningLevel } from '../constants';

export const CULTURAL_CONTENT_TYPES = ['story', 'folktale', 'proverb'] as const;
export type CulturalContentType = (typeof CULTURAL_CONTENT_TYPES)[number];

export const CULTURAL_CONTENT_TYPE_LABELS: Record<CulturalContentType, string> = {
  story: 'Story',
  folktale: 'Folktale',
  proverb: 'Proverb',
};

export const CULTURAL_CONTENT_STATUSES = ['draft', 'published', 'archived'] as const;
export type CulturalContentStatus = (typeof CULTURAL_CONTENT_STATUSES)[number];

export const CULTURAL_CONTENT_STATUS_LABELS: Record<CulturalContentStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

/**
 * Body fields differ per type. Stories & folktales share the long-form body
 * shape (English/Yoruba content). Proverbs use a shorter explanation + usage.
 */
export interface CulturalStoryBody {
  /** Long-form English narrative (HTML or markdown). */
  contentEnglish: string;
  /** Long-form translated narrative. */
  contentTranslated: string;
}

export interface CulturalProverbBody {
  explanation: string;
  usageExample: string;
}

export type CulturalContentBody = CulturalStoryBody | CulturalProverbBody;

export interface CulturalContent {
  id: string;
  type: CulturalContentType;
  language: LanguageCode;
  tier: LearningLevel;
  titleEnglish: string;
  titleTranslated: string;
  shortDescription: string;
  /** Type-specific payload — story/folktale use CulturalStoryBody, proverb uses CulturalProverbBody. */
  body: CulturalContentBody;
  coverImageUrl: string | null;
  audioUrl: string | null;
  audioFileName: string | null;
  status: CulturalContentStatus;
  views: number;
  publishedAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}
