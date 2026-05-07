import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CountryCode } from '@lexiroot/shared';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  emailVerifiedAt: string | null;
  country: CountryCode | null;
  avatarUrl: string | null;
}

interface AuthState {
  token: string | null;
  user: AdminUser | null;
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
    setCredentials(state, action: PayloadAction<{ token: string; user: AdminUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
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

export const { setCredentials, clearCredentials, setHydrated } = authSlice.actions;
export default authSlice.reducer;
