import type { LanguageCode, LearningLevel } from '../constants';

export const LESSON_TYPES = [
  'letters-numbers',
  'vocabulary',
  'recognition',
  'sentence',
  'exercise',
] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

// Types a new lesson can be created as. 'exercise' stays in LESSON_TYPES so
// legacy rows still load, but every other type now carries its own practice
// exercises, so a standalone exercise lesson is no longer created.
export const CREATABLE_LESSON_TYPES = [
  'letters-numbers',
  'vocabulary',
  'recognition',
  'sentence',
] as const satisfies readonly LessonType[];
export type CreatableLessonType = (typeof CREATABLE_LESSON_TYPES)[number];

/** One occupied (language, tier, level, type) curriculum slot. */
export interface LessonSlot {
  id: string;
  language: LanguageCode;
  tier: LearningLevel;
  level: number;
  type: LessonType;
}

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  'letters-numbers': 'Letters & Numbers',
  vocabulary: 'Vocabulary',
  recognition: 'Recognition',
  sentence: 'Sentence',
  exercise: 'Exercise',
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
  /** Difficulty tier — beginner / intermediate / advanced. */
  tier: LearningLevel;
  /** Numeric position within a tier (admin-defined: 1, 2, 3, …). */
  level: number;
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
