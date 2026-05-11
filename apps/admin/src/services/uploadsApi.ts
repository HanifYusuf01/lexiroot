import { api } from './api';

export interface MediaSignaturePayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
  resourceType: 'image' | 'video';
}

export const uploadsApi = api.injectEndpoints({
  endpoints: (build) => ({
    signLessonAudio: build.mutation<MediaSignaturePayload, void>({
      query: () => ({ url: '/uploads/lesson-audio/signature', method: 'POST' }),
    }),
    signLessonImage: build.mutation<MediaSignaturePayload, void>({
      query: () => ({ url: '/uploads/lesson-image/signature', method: 'POST' }),
    }),
  }),
});

export const { useSignLessonAudioMutation, useSignLessonImageMutation } = uploadsApi;
