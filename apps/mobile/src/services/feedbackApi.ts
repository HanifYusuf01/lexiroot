import { api } from './api';

interface CreateFeedbackBody {
  rating: number;
  message?: string;
}

interface FeedbackResponse {
  id: string;
  createdAt: string;
}

export const feedbackApi = api.injectEndpoints({
  endpoints: (build) => ({
    createFeedback: build.mutation<FeedbackResponse, CreateFeedbackBody>({
      query: (body) => ({ url: '/feedback', method: 'POST', body }),
    }),
  }),
});

export const { useCreateFeedbackMutation } = feedbackApi;
