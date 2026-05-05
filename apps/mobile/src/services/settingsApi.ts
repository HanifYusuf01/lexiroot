import { api } from './api';
import type {
  LanguageLevelPref,
  LessonDifficulty,
  VoicePlaybackSpeed,
} from '@lexiroot/shared';

export interface UserSettings {
  userId: string;
  soundHaptics: boolean;
  languageLevel: LanguageLevelPref | null;
  lessonDifficulty: LessonDifficulty | null;
  autoplayAudio: boolean;
  voicePlaybackSpeed: VoicePlaybackSpeed | null;
  microphoneAccess: boolean;
  streakReminder: boolean;
  achievementAlerts: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string | null;
  culturalContentAlert: boolean;
  updatedAt: string;
}

export type UpdateSettingsBody = Partial<
  Omit<UserSettings, 'userId' | 'updatedAt'>
>;

export const settingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<UserSettings, void>({
      query: () => '/me/settings',
      providesTags: ['Settings'],
    }),
    updateSettings: build.mutation<UserSettings, UpdateSettingsBody>({
      query: (body) => ({ url: '/me/settings', method: 'PATCH', body }),
      // Optimistic: patch the cache so the UI reflects the change instantly.
      async onQueryStarted(patch, { dispatch, queryFulfilled }) {
        const undo = dispatch(
          settingsApi.util.updateQueryData('getSettings', undefined, (draft) => {
            Object.assign(draft, patch);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          undo.undo();
        }
      },
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
