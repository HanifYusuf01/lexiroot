import * as SecureStore from 'expo-secure-store';
import type { CountryCode, LearningLevel } from '@lexiroot/shared';

const AUTH_KEY = 'lexiroot.auth';
const PENDING_KEY = 'lexiroot.pendingEmail';

export interface StoredAuthUser {
  id: string;
  email: string;
  displayName: string;
  emailVerifiedAt: string | null;
  country: CountryCode | null;
  avatarUrl: string | null;
  level?: LearningLevel | null;
  xp?: number;
  currentStreakDays?: number;
  lessonsCompleted?: number;
}

export interface StoredAuth {
  token: string;
  user: StoredAuthUser;
}

export const authStorage = {
  async get(): Promise<StoredAuth | null> {
    try {
      const raw = await SecureStore.getItemAsync(AUTH_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredAuth;
    } catch {
      return null;
    }
  },

  async set(data: StoredAuth): Promise<void> {
    await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify(data));
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(AUTH_KEY);
  },
};

export const pendingSignupStorage = {
  async get(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(PENDING_KEY);
    } catch {
      return null;
    }
  },

  async set(email: string): Promise<void> {
    await SecureStore.setItemAsync(PENDING_KEY, email);
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(PENDING_KEY);
  },
};
