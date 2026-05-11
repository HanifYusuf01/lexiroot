import { api } from './api';
import type { Category } from '@lexiroot/shared';

interface CreateCategoryBody {
  name: string;
  sortOrder?: number;
}

interface UpdateCategoryBody {
  id: string;
  name?: string;
  sortOrder?: number;
}

export const categoriesApi = api.injectEndpoints({
  endpoints: (build) => ({
    listCategories: build.query<Category[], void>({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    createCategory: build.mutation<Category, CreateCategoryBody>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: build.mutation<Category, UpdateCategoryBody>({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: build.mutation<void, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category'],
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
