import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Category,
  CreateCategoryInput,
  CreateItemInput,
  Item,
} from '@erp/shared';
import { apiFetch } from '@/lib/api';

const CATEGORIES_KEY = ['inventory', 'categories'] as const;
const ITEMS_KEY = ['inventory', 'items'] as const;

/* ------------------------------ Categories ------------------------------ */

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => apiFetch<Category[]>('/inventory/categories'),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      apiFetch<Category>('/inventory/categories', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/inventory/categories/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}

/* --------------------------------- Items --------------------------------- */

export function useItems() {
  return useQuery({
    queryKey: ITEMS_KEY,
    queryFn: () => apiFetch<Item[]>('/inventory/items'),
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItemInput) =>
      apiFetch<Item>('/inventory/items', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ITEMS_KEY });
      void qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/inventory/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ITEMS_KEY });
      void qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}
