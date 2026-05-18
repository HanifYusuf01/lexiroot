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
