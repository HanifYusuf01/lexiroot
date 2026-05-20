export const LESSON_ENTRY_KINDS = [
  'vocabulary',
  'sentence',
  'letter',
  'number',
  'recognition-item',
] as const;
export type LessonEntryKind = (typeof LESSON_ENTRY_KINDS)[number];

export interface VocabularyEntryPayload {
  word: string;
  meaning: string;
  audioUrl: string;
  exampleSentence: string;
}

export interface SentenceEntryPayload {
  sentence: string;
  meaning: string;
  audioUrl: string;
}

export interface LetterEntryPayload {
  letter: string;
  audioUrl: string;
}

export interface NumberEntryPayload {
  /** Numeral in the lesson's target language (e.g. Yoruba: "Èèjì"). */
  value: string;
  /** Translation in the learner's UI language (e.g. English: "Two"). */
  translation: string;
  audioUrl: string;
}

export interface RecognitionItemPayload {
  word: string;
  meaning: string;
  imageUrl: string;
  audioUrl: string;
}

export type LessonEntryPayloadMap = {
  vocabulary: VocabularyEntryPayload;
  sentence: SentenceEntryPayload;
  letter: LetterEntryPayload;
  number: NumberEntryPayload;
  'recognition-item': RecognitionItemPayload;
};

export interface LessonEntryRow<K extends LessonEntryKind = LessonEntryKind> {
  id: string;
  lessonId: string;
  kind: K;
  orderIndex: number;
  payload: LessonEntryPayloadMap[K];
  createdAt: string;
  updatedAt: string;
}

export interface LessonEntryInput<K extends LessonEntryKind = LessonEntryKind> {
  id?: string;
  kind: K;
  orderIndex: number;
  payload: LessonEntryPayloadMap[K];
}
