import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CountryCode } from '@lexiroot/shared';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  emailVerifiedAt: string | null;
  country: CountryCode | null;
  avatarUrl: string | null;
  xp?: number;
  currentStreakDays?: number;
  lessonsCompleted?: number;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  pendingEmail: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  pendingEmail: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.pendingEmail = null;
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
    },
    setPendingEmail(state, action: PayloadAction<string>) {
      state.pendingEmail = action.payload;
    },
    clearPendingEmail(state) {
      state.pendingEmail = null;
    },
    clearCredentials(state) {
      state.token = null;
      state.user = null;
      state.pendingEmail = null;
    },
    setHydrated(state) {
      state.hydrated = true;
    },
  },
});

export const {
  setCredentials,
  setUser,
  setPendingEmail,
  clearPendingEmail,
  clearCredentials,
  setHydrated,
} = authSlice.actions;
export default authSlice.reducer;
