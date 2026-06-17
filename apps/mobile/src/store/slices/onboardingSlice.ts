import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  CountryCode,
  LearningLevel as BackendLearningLevel,
  LearningReason,
} from '@lexiroot/shared';

/** A language code from the runtime catalog (admin Settings), e.g. "yo". */
export type LearningLanguage = string;
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
  country: CountryCode | null;
  completed: boolean;
}

const initialState: OnboardingState = {
  reason: null,
  level: null,
  language: null,
  country: null,
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
    setCountry(state, action: PayloadAction<CountryCode>) {
      state.country = action.payload;
    },
    completeOnboarding(state) {
      state.completed = true;
    },
    resetOnboarding() {
      return initialState;
    },
  },
});

export const {
  setReason,
  setLevel,
  setLanguage,
  setCountry,
  completeOnboarding,
  resetOnboarding,
} = onboardingSlice.actions;
export default onboardingSlice.reducer;
