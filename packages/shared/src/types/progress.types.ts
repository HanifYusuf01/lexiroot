export interface ProgressSummary {
  streak: number;
  totalXp: number;
  lessonsCompleted: number;
  completedLessonIds: string[];
}

export interface LessonCompletionResult {
  completion: {
    id: string;
    userId: string;
    lessonId: string;
    xpEarned: number;
    correctCount: number;
    totalCount: number;
    completedAt: string;
  };
  xpAwarded: number;
  streak: number;
  totalXp: number;
}

// In-progress lesson state for the resume-mid-lesson flow.
// Keyed per-user by (tier, level). One row per active level run.
export type LessonStepKind =
  | 'intro'
  | 'content'
  | 'practice-intro'
  | 'exercise'
  | 'almost-there'
  | 'complete';

export interface LessonProgressState {
  tier: string;
  level: number;
  subIdx: number;
  subLessonId: string | null;
  stepKind: LessonStepKind;
  stepIndex: number;
  correctCount: number;
  xp: number;
  updatedAt: string;
}
