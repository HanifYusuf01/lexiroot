import * as SecureStore from 'expo-secure-store';
import type { CountryCode, LearningLevel } from '@lexiroot/shared';

const AUTH_KEY = 'lexiroot.auth';
const PENDING_KEY = 'lexiroot.pendingEmail';
const PENDING_INVITE_KEY = 'lexiroot.pending-invite';

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

/**
 * An invitation the person opened before signing in.
 *
 * Accepting requires an account, and the route there is long — sign in, or sign
 * up, verify an email, finish onboarding. Threading the token through every one
 * of those screens as a parameter would mean five chances to drop it, and it
 * *was* dropped: "Sign in to accept" navigated away and the invitation was gone
 * for good, with nothing in the app to get back to.
 *
 * Parking it here instead means any path back into a signed-in session can pick
 * it up again.
 */
export const pendingInviteStorage = {
  async get(): Promise<{ kind: 'friend' | 'family'; token: string } | null> {
    try {
      const raw = await SecureStore.getItemAsync(PENDING_INVITE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { kind?: string; token?: string };
      if (parsed.kind !== 'friend' && parsed.kind !== 'family') return null;
      return parsed.token ? { kind: parsed.kind, token: parsed.token } : null;
    } catch {
      return null;
    }
  },

  async set(kind: 'friend' | 'family', token: string): Promise<void> {
    await SecureStore.setItemAsync(PENDING_INVITE_KEY, JSON.stringify({ kind, token }));
  },

  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(PENDING_INVITE_KEY);
    } catch {
      // Nothing stored, or the store is unavailable — either way there is
      // nothing to resume, and failing here would block a sign-in.
    }
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
