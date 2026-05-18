export const EXERCISE_SUB_TYPES = [
  'listen-select',
  'correct-meaning',
  'word-arrange',
  'recognition',
  'name-from-image',
] as const;
export type ExerciseSubType = (typeof EXERCISE_SUB_TYPES)[number];

export const EXERCISE_SUB_TYPE_LABELS: Record<ExerciseSubType, string> = {
  'listen-select': 'Listen & select',
  'correct-meaning': 'Correct Meaning',
  'word-arrange': 'Word Arrange',
  recognition: 'Recognition',
  'name-from-image': 'Name from Image',
};

export const EXERCISE_CATEGORIES = [
  'letters-numbers',
  'vocabulary',
  'recognition',
  'sentence',
] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  'letters-numbers': 'Letters & Numbers',
  vocabulary: 'Vocabulary',
  recognition: 'Recognition',
  sentence: 'Sentence',
};

export const EXERCISE_CATEGORY_SUB_TYPES: Record<ExerciseCategory, readonly ExerciseSubType[]> = {
  'letters-numbers': ['listen-select'],
  vocabulary: ['listen-select', 'correct-meaning'],
  recognition: ['recognition', 'name-from-image'],
  sentence: ['word-arrange', 'correct-meaning'],
};

export interface OptionItem {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface ImageOptionItem {
  id: string;
  imageUrl: string;
  isCorrect: boolean;
}

export interface ListenSelectPayload {
  audioUrl: string;
  instruction: string;
  options: OptionItem[];
}

export interface CorrectMeaningPayload {
  prompt: string;
  instruction: string;
  options: OptionItem[];
}

export interface WordArrangeTile {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface WordArrangePayload {
  sentence: string;
  instruction: string;
  correctAnswer: string;
  tiles: WordArrangeTile[];
}

export interface RecognitionPayload {
  word: string;
  instruction: string;
  options: ImageOptionItem[];
}

export interface NameFromImagePayload {
  imageUrl: string;
  instruction: string;
  options: OptionItem[];
}

export type ExercisePayloadMap = {
  'listen-select': ListenSelectPayload;
  'correct-meaning': CorrectMeaningPayload;
  'word-arrange': WordArrangePayload;
  recognition: RecognitionPayload;
  'name-from-image': NameFromImagePayload;
};

export type ExercisePayload =
  | ({ subType: 'listen-select' } & { payload: ListenSelectPayload })
  | ({ subType: 'correct-meaning' } & { payload: CorrectMeaningPayload })
  | ({ subType: 'word-arrange' } & { payload: WordArrangePayload })
  | ({ subType: 'recognition' } & { payload: RecognitionPayload })
  | ({ subType: 'name-from-image' } & { payload: NameFromImagePayload });

export interface ExerciseRow<S extends ExerciseSubType = ExerciseSubType> {
  id: string;
  lessonId: string;
  category: ExerciseCategory;
  subType: S;
  orderIndex: number;
  payload: ExercisePayloadMap[S];
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseInput<S extends ExerciseSubType = ExerciseSubType> {
  /** When updating, send the existing exercise's id; omit for new ones. */
  id?: string;
  category: ExerciseCategory;
  subType: S;
  orderIndex: number;
  payload: ExercisePayloadMap[S];
}
