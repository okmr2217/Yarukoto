"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGroups, createGroup, updateGroup, deleteGroup, reorderGroups } from "@/actions";
import type { Group } from "@/types";

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const result = await getGroups();
      if (!result.success) throw new Error(result.error);
      return result.data.groups;
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, emoji, color }: { name: string; emoji?: string; color?: string }) => {
      const result = await createGroup({ name, emoji, color });
      if (!result.success) throw new Error(result.error);
      return result.data.group;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, emoji, color }: { id: string; name?: string; emoji?: string | null; color?: string | null }) => {
      const result = await updateGroup({ id, name, emoji, color });
      if (!result.success) throw new Error(result.error);
      return result.data.group;
    },
    onMutate: async ({ id, name, emoji, color }) => {
      await queryClient.cancelQueries({ queryKey: ["groups"] });
      const previous = queryClient.getQueryData<Group[]>(["groups"]);
      if (previous) {
        queryClient.setQueryData<Group[]>(
          ["groups"],
          previous.map((g) =>
            g.id === id
              ? {
                  ...g,
                  name: name ?? g.name,
                  emoji: emoji !== undefined ? emoji : g.emoji,
                  color: color !== undefined ? color : g.color,
                  updatedAt: new Date().toISOString(),
                }
              : g,
          ),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["groups"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteGroup({ id });
      if (!result.success) throw new Error(result.error);
      return result.data.id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["groups"] });
      const previous = queryClient.getQueryData<Group[]>(["groups"]);
      if (previous) {
        queryClient.setQueryData<Group[]>(["groups"], previous.filter((g) => g.id !== id));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["groups"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useReorderGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; sortOrder: number }[]) => {
      const result = await reorderGroups({ updates });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
