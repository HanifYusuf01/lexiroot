import * as SecureStore from 'expo-secure-store';
import type { CountryCode } from '@lexiroot/shared';

const KEY = 'lexiroot.auth';

export interface StoredAuthUser {
  id: string;
  email: string;
  displayName: string;
  emailVerifiedAt: string | null;
  country: CountryCode | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface StoredAuth {
  token: string;
  user: StoredAuthUser;
}

export const authStorage = {
  async get(): Promise<StoredAuth | null> {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredAuth;
    } catch {
      return null;
    }
  },

  async set(data: StoredAuth): Promise<void> {
    await SecureStore.setItemAsync(KEY, JSON.stringify(data));
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY);
  },
};
