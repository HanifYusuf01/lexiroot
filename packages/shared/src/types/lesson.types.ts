import type { LanguageCode, LearningLevel } from '../constants';

export const LESSON_TYPES = ['sentence', 'vocabulary', 'exercise', 'alphabets-recognition'] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  sentence: 'Sentence',
  vocabulary: 'Vocabulary',
  exercise: 'Exercise',
  'alphabets-recognition': 'Alphabets & Recognition',
};

export const LESSON_STATUSES = ['draft', 'published', 'archived'] as const;
export type LessonStatus = (typeof LESSON_STATUSES)[number];

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

export const DURATION_BUCKETS = [
  '1-2 minutes',
  '3-5 minutes',
  '5-10 minutes',
  '10-15 minutes',
  '15+ minutes',
] as const;
export type DurationBucket = (typeof DURATION_BUCKETS)[number];

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt: string;
}

export interface RecognitionPromptMeta {
  audioUrl: string;
  instruction: string;
}

export interface LessonMeta {
  recognitionPrompt?: RecognitionPromptMeta;
}

export interface Lesson {
  id: string;
  language: LanguageCode;
  level: LearningLevel;
  categoryId: string;
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
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}
