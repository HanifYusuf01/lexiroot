import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  LanguageCode,
  LearningLevel as BackendLearningLevel,
  LearningReason,
} from '@lexiroot/shared';

export type LearningLanguage = LanguageCode;
export type { LearningReason };

/** UI-facing level: keeps "starting" and "a-little" as separate options for nicer UX. */
export type LearningLevel = 'starting' | 'a-little' | 'basic' | 'advanced';

const LEVEL_MAP: Record<LearningLevel, BackendLearningLevel> = {
  starting: 'beginner',
  'a-little': 'beginner',
  basic: 'intermediate',
  advanced: 'advanced',
};

export function toBackendLevel(level: LearningLevel): BackendLearningLevel {
  return LEVEL_MAP[level];
}

interface OnboardingState {
  reason: LearningReason | null;
  level: LearningLevel | null;
  language: LearningLanguage | null;
  completed: boolean;
}

const initialState: OnboardingState = {
  reason: null,
  level: null,
  language: null,
  completed: false,
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setReason(state, action: PayloadAction<LearningReason>) {
      state.reason = action.payload;
    },
    setLevel(state, action: PayloadAction<LearningLevel>) {
      state.level = action.payload;
    },
    setLanguage(state, action: PayloadAction<LearningLanguage>) {
      state.language = action.payload;
    },
    completeOnboarding(state) {
      state.completed = true;
    },
    resetOnboarding() {
      return initialState;
    },
  },
});

export const { setReason, setLevel, setLanguage, completeOnboarding, resetOnboarding } =
  onboardingSlice.actions;
export default onboardingSlice.reducer;
