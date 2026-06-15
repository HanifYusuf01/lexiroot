import type { CountryCode } from '@lexiroot/shared';

const KEY = 'lexiroot.admin.auth';

export interface StoredAdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin' | 'instructor';
  emailVerifiedAt: string | null;
  country: CountryCode | null;
  avatarUrl: string | null;
}

export interface StoredAdminAuth {
  token: string;
  user: StoredAdminUser;
}

export const adminAuthStorage = {
  get(): StoredAdminAuth | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredAdminAuth;
    } catch {
      return null;
    }
  },
  set(data: StoredAdminAuth): void {
    localStorage.setItem(KEY, JSON.stringify(data));
  },
  clear(): void {
    localStorage.removeItem(KEY);
  },
};
