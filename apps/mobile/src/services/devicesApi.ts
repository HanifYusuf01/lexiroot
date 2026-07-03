import type { PushDeviceDto, RegisterDeviceBody } from '@lexiroot/shared';
import { api } from './api';

/**
 * Push-device registration endpoints. Registration is idempotent server-side
 * (keyed on installation id), so re-registering on every launch is cheap and
 * keeps the token / timezone fresh.
 */
export const devicesApi = api.injectEndpoints({
  endpoints: (build) => ({
    registerDevice: build.mutation<PushDeviceDto, RegisterDeviceBody>({
      query: (body) => ({ url: '/me/devices', method: 'POST', body }),
    }),
    unregisterDevice: build.mutation<void, string>({
      query: (installationId) => ({
        url: `/me/devices/${installationId}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const { useRegisterDeviceMutation, useUnregisterDeviceMutation } = devicesApi;
