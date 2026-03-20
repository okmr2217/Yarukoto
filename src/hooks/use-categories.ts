"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  createCategory,
  updateCategory,
  updateCategorySortOrder,
  deleteCategory,
} from "@/actions";
import type { Category } from "@/types";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const result = await getCategories();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.categories;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const result = await createCategory({ name, color });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.category;
    },
    onMutate: async ({ name, color }) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const previous = queryClient.getQueryData<Category[]>(["categories"]);

      // Optimistic update: append to end
      const maxSortOrder = previous ? Math.max(...previous.map((c) => c.sortOrder), -1) : -1;
      const optimisticCategory: Category = {
        id: `temp-${Date.now()}`,
        name,
        color,
        sortOrder: maxSortOrder + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (previous) {
        queryClient.setQueryData<Category[]>(["categories"], [...previous, optimisticCategory]);
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["categories"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      color,
    }: {
      id: string;
      name?: string;
      color?: string;
    }) => {
      const result = await updateCategory({ id, name, color });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.category;
    },
    onMutate: async ({ id, name, color }) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const previous = queryClient.getQueryData<Category[]>(["categories"]);

      if (previous) {
        queryClient.setQueryData<Category[]>(
          ["categories"],
          previous.map((cat) =>
            cat.id === id
              ? {
                  ...cat,
                  name: name ?? cat.name,
                  color: color !== undefined ? color : cat.color,
                  updatedAt: new Date().toISOString(),
                }
              : cat,
          ),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["categories"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategorySortOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; sortOrder: number }[]) => {
      const result = await updateCategorySortOrder({ updates });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCategory({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const previous = queryClient.getQueryData<Category[]>(["categories"]);

      if (previous) {
        queryClient.setQueryData<Category[]>(
          ["categories"],
          previous.filter((cat) => cat.id !== id),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["categories"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
