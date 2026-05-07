import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CountryCode } from '@lexiroot/shared';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  emailVerifiedAt: string | null;
  country: CountryCode | null;
  avatarUrl: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
    },
    clearCredentials(state) {
      state.token = null;
      state.user = null;
    },
    setHydrated(state) {
      state.hydrated = true;
    },
  },
});

export const { setCredentials, setUser, clearCredentials, setHydrated } = authSlice.actions;
export default authSlice.reducer;
