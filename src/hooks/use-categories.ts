"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  getArchivedCategories,
  createCategory,
  updateCategory,
  updateCategorySortOrder,
  deleteCategory,
  archiveCategory,
  unarchiveCategory,
} from "@/actions";
import type { Category, Group } from "@/types";

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
    mutationFn: async ({ name, color, description, groupId }: { name: string; color: string; description?: string; groupId?: string | null }) => {
      const result = await createCategory({ name, color, description, groupId });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.category;
    },
    onMutate: async ({ name, color, description, groupId }) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const previous = queryClient.getQueryData<Category[]>(["categories"]);

      const maxSortOrder = previous ? Math.max(...previous.map((c) => c.sortOrder), -1) : -1;
      const groups = queryClient.getQueryData<Group[]>(["groups"]);
      const group = groupId ? (groups?.find((g) => g.id === groupId) ?? null) : null;
      const optimisticCategory: Category = {
        id: `temp-${Date.now()}`,
        name,
        color,
        description: description ?? null,
        sortOrder: maxSortOrder + 1,
        archivedAt: null,
        groupId: groupId ?? null,
        group: group ? { id: group.id, name: group.name, color: group.color } : null,
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
      description,
      groupId,
    }: {
      id: string;
      name?: string;
      color?: string;
      description?: string;
      groupId?: string | null;
    }) => {
      const result = await updateCategory({ id, name, color, description, groupId });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.category;
    },
    onMutate: async ({ id, name, color, description, groupId }) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const previous = queryClient.getQueryData<Category[]>(["categories"]);

      if (previous) {
        const groups = queryClient.getQueryData<Group[]>(["groups"]);
        queryClient.setQueryData<Category[]>(
          ["categories"],
          previous.map((cat) => {
            if (cat.id !== id) return cat;
            const newGroupId = groupId !== undefined ? groupId : cat.groupId;
            const newGroup =
              groupId !== undefined
                ? groupId
                  ? (groups?.find((g) => g.id === groupId) ?? null)
                  : null
                : cat.group;
            return {
              ...cat,
              name: name ?? cat.name,
              color: color !== undefined ? color : cat.color,
              description: description !== undefined ? description : cat.description,
              groupId: newGroupId,
              group: newGroup ? { id: newGroup.id, name: newGroup.name, color: newGroup.color } : null,
              updatedAt: new Date().toISOString(),
            };
          }),
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

export function useArchivedCategories() {
  return useQuery({
    queryKey: ["categories", "archived"],
    queryFn: async () => {
      const result = await getArchivedCategories();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.categories;
    },
  });
}

export function useArchiveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await archiveCategory({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.category;
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
      queryClient.invalidateQueries({ queryKey: ["categories", "archived"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUnarchiveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await unarchiveCategory({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.category;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "archived"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
