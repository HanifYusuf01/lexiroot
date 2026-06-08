import type { PlatformSettings, UpdatePlatformSettings } from '@lexiroot/shared';
import { api } from './api';

export const platformSettingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    platformSettings: build.query<PlatformSettings, void>({
      query: () => '/admin/platform-settings',
      providesTags: ['PlatformSettings'],
    }),
    updatePlatformSettings: build.mutation<PlatformSettings, UpdatePlatformSettings>({
      query: (body) => ({
        url: '/admin/platform-settings',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['PlatformSettings'],
    }),
  }),
});

export const { usePlatformSettingsQuery, useUpdatePlatformSettingsMutation } = platformSettingsApi;
