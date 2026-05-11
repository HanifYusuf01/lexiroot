export const EXERCISE_SUB_TYPES = [
  'listen-select',
  'correct-meaning',
  'word-arrange',
  'recognition',
] as const;
export type ExerciseSubType = (typeof EXERCISE_SUB_TYPES)[number];

export const EXERCISE_SUB_TYPE_LABELS: Record<ExerciseSubType, string> = {
  'listen-select': 'Listen & select',
  'correct-meaning': 'Correct Meaning',
  'word-arrange': 'Word Arrange',
  recognition: 'Recognition',
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

export type ExercisePayloadMap = {
  'listen-select': ListenSelectPayload;
  'correct-meaning': CorrectMeaningPayload;
  'word-arrange': WordArrangePayload;
  recognition: RecognitionPayload;
};

export type ExercisePayload =
  | ({ subType: 'listen-select' } & { payload: ListenSelectPayload })
  | ({ subType: 'correct-meaning' } & { payload: CorrectMeaningPayload })
  | ({ subType: 'word-arrange' } & { payload: WordArrangePayload })
  | ({ subType: 'recognition' } & { payload: RecognitionPayload });

export interface ExerciseRow<S extends ExerciseSubType = ExerciseSubType> {
  id: string;
  lessonId: string;
  subType: S;
  orderIndex: number;
  payload: ExercisePayloadMap[S];
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseInput<S extends ExerciseSubType = ExerciseSubType> {
  /** When updating, send the existing exercise's id; omit for new ones. */
  id?: string;
  subType: S;
  orderIndex: number;
  payload: ExercisePayloadMap[S];
}
