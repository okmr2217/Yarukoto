"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  skipTask,
  unskipTask,
  deleteTask,
  reorderTasks,
  toggleFavorite,
} from "@/actions";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  SkipTaskInput,
  GetAllTasksInput,
} from "@/lib/validations";
import type { Task, Category } from "@/types";

type QueryKey = readonly unknown[];

type CacheSnapshot = {
  previousAllTasks: Array<[QueryKey, unknown]>;
};

export function useTaskMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["allTasks"] });
  };

  const cancelAllQueries = async () => {
    await queryClient.cancelQueries({ queryKey: ["allTasks"] });
  };

  const snapshotCache = (): CacheSnapshot => ({
    previousAllTasks: queryClient.getQueriesData({ queryKey: ["allTasks"] }),
  });

  const rollbackCache = (snapshot: CacheSnapshot) => {
    snapshot.previousAllTasks.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  };

  const updateAllTasksCache = (updater: (task: Task) => Task | null) => {
    queryClient.setQueriesData({ queryKey: ["allTasks"] }, (old: Task[] | undefined) => {
      if (!old) return old;
      const updated: Task[] = [];
      for (const task of old) {
        const result = updater(task);
        if (result !== null) updated.push(result);
      }
      return updated;
    });
  };

  const updateAllTasksCacheWithFilters = (updater: (task: Task, filters: GetAllTasksInput) => Task | null) => {
    const queries = queryClient.getQueriesData<Task[]>({ queryKey: ["allTasks"] });
    for (const [queryKey, data] of queries) {
      if (!data) continue;
      const filters = ((queryKey as unknown[])[1] as GetAllTasksInput) ?? {};
      const updated: Task[] = [];
      for (const task of data) {
        const result = updater(task, filters);
        if (result !== null) updated.push(result);
      }
      queryClient.setQueryData(queryKey, updated);
    }
  };

  // Builds the standard onMutate/onError/onSettled triad for optimistic mutations.
  // `updateFn` runs after cancel+snapshot; its return value is merged into context.
  function withOptimistic<TInput, TExtra = Record<never, never>>(
    updateFn: (input: TInput) => TExtra | void,
    extraOnError?: (err: Error, input: TInput) => void,
  ) {
    return {
      onMutate: async (input: TInput): Promise<CacheSnapshot & TExtra> => {
        await cancelAllQueries();
        const snapshot = snapshotCache();
        const extra = updateFn(input);
        return { ...snapshot, ...(extra ?? {}) } as CacheSnapshot & TExtra;
      },
      onError: (err: Error, input: TInput, context: (CacheSnapshot & TExtra) | undefined) => {
        if (context) rollbackCache(context);
        extraOnError?.(err, input);
      },
      onSettled: invalidateAll,
    };
  }

  const create = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const result = await createTask(input);
      if (!result.success) throw new Error(result.error);
      return result.data.task;
    },
    ...withOptimistic<CreateTaskInput, { tempId: string }>((input) => {
      const tempId = `temp-${crypto.randomUUID()}`;
      const categories = queryClient.getQueryData<Category[]>(["categories"]);
      const foundCategory = categories?.find((c) => c.id === input.categoryId) ?? null;
      const tempTask: Task = {
        id: tempId,
        title: input.title,
        memo: input.memo || null,
        status: "PENDING",
        isFavorite: false,
        scheduledAt: input.scheduledAt || null,
        completedAt: null,
        skippedAt: null,
        skipReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categoryId: input.categoryId || null,
        category: foundCategory ? { id: foundCategory.id, name: foundCategory.name, color: foundCategory.color, groupColor: foundCategory.group?.color ?? null } : null,
      };

      const queries = queryClient.getQueriesData<Task[]>({ queryKey: ["allTasks"] });
      for (const [queryKey, data] of queries) {
        if (!data) continue;
        const filters = ((queryKey as unknown[])[1] as GetAllTasksInput) ?? {};
        if (filters.status && filters.status !== "pending") continue;
        queryClient.setQueryData(queryKey, [tempTask, ...data]);
      }

      return { tempId };
    }),
  });

  const update = useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const result = await updateTask({
        id: input.id,
        title: input.title,
        scheduledAt: input.scheduledAt,
        categoryId: input.categoryId,
        memo: input.memo,
      });
      if (!result.success) throw new Error(result.error);
      return result.data.task;
    },
    ...withOptimistic<UpdateTaskInput>(
      (input) => {
        const categories = queryClient.getQueryData<Category[]>(["categories"]);
        const newCategoryId = input.categoryId === undefined ? undefined : input.categoryId;
        const newCategory =
          newCategoryId === undefined
            ? undefined
            : newCategoryId === null
              ? null
              : (categories?.find((c) => c.id === newCategoryId) ?? undefined);

        updateAllTasksCache((task) =>
          task.id === input.id
            ? {
                ...task,
                title: input.title ?? task.title,
                memo: input.memo === undefined ? task.memo : input.memo,
                scheduledAt: input.scheduledAt === undefined ? task.scheduledAt : input.scheduledAt,
                categoryId: newCategoryId === undefined ? task.categoryId : newCategoryId,
                category:
                  newCategory === undefined
                    ? task.category
                    : newCategory === null
                      ? null
                      : { id: newCategory.id, name: newCategory.name, color: newCategory.color, groupColor: newCategory.group?.color ?? null },
                updatedAt: new Date().toISOString(),
              }
            : task,
        );
      },
      () => toast.error("タスクの更新に失敗しました"),
    ),
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const result = await completeTask({ id });
      if (!result.success) throw new Error(result.error);
      return result.data.task;
    },
    ...withOptimistic<string, { taskTitle?: string }>((id) => {
      const allTasks = queryClient.getQueriesData<Task[]>({ queryKey: ["allTasks"] });
      let taskTitle: string | undefined;
      for (const [, tasks] of allTasks) {
        const found = tasks?.find((t) => t.id === id);
        if (found) { taskTitle = found.title; break; }
      }

      updateAllTasksCacheWithFilters((task, filters) => {
        if (task.id !== id) return task;
        const updated = { ...task, status: "COMPLETED" as const, completedAt: new Date().toISOString() };
        if (filters.status === "pending") return null;
        return updated;
      });

      return { taskTitle };
    }),
    onSuccess: (_data, id, context) => {
      const title = context?.taskTitle;
      toast.success(title ? `"${title}" を完了しました` : "タスクを完了しました", {
        action: { label: "元に戻す", onClick: () => uncomplete.mutate(id) },
      });
    },
  });

  const uncomplete = useMutation({
    mutationFn: async (id: string) => {
      const result = await uncompleteTask({ id });
      if (!result.success) throw new Error(result.error);
      return result.data.task;
    },
    ...withOptimistic<string>((id) => {
      updateAllTasksCacheWithFilters((task, filters) => {
        if (task.id !== id) return task;
        const updated = { ...task, status: "PENDING" as const, completedAt: null };
        if (filters.status === "completed") return null;
        return updated;
      });
    }),
  });

  const skip = useMutation({
    mutationFn: async (input: SkipTaskInput) => {
      const result = await skipTask(input);
      if (!result.success) throw new Error(result.error);
      return result.data.task;
    },
    ...withOptimistic<SkipTaskInput>((input) => {
      updateAllTasksCacheWithFilters((task, filters) => {
        if (task.id !== input.id) return task;
        const updated = { ...task, status: "SKIPPED" as const, skippedAt: new Date().toISOString(), skipReason: input.reason || null };
        if (filters.status === "pending") return null;
        return updated;
      });
    }),
  });

  const unskip = useMutation({
    mutationFn: async (id: string) => {
      const result = await unskipTask({ id });
      if (!result.success) throw new Error(result.error);
      return result.data.task;
    },
    ...withOptimistic<string>((id) => {
      updateAllTasksCacheWithFilters((task, filters) => {
        if (task.id !== id) return task;
        const updated = { ...task, status: "PENDING" as const, skippedAt: null, skipReason: null };
        if (filters.status === "skipped") return null;
        return updated;
      });
    }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTask({ id });
      if (!result.success) throw new Error(result.error);
      return result.data.id;
    },
    ...withOptimistic<string>((id) => {
      updateAllTasksCache((task) => (task.id === id ? null : task));
    }),
  });

  const reorder = useMutation({
    mutationFn: async (input: { taskId: string; beforeTaskId?: string; afterTaskId?: string }) => {
      const result = await reorderTasks(input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    ...withOptimistic<{ taskId: string; beforeTaskId?: string; afterTaskId?: string }>((input) => {
      const queries = queryClient.getQueriesData<Task[]>({ queryKey: ["allTasks"] });
      for (const [queryKey, old] of queries) {
        if (!old || !Array.isArray(old)) continue;
        const { taskId, beforeTaskId, afterTaskId } = input;
        const task = old.find((t) => t.id === taskId);
        if (!task) continue;
        const withoutTask = old.filter((t) => t.id !== taskId);
        let newIndex: number;
        if (beforeTaskId) {
          newIndex = withoutTask.findIndex((t) => t.id === beforeTaskId) + 1;
        } else if (afterTaskId) {
          newIndex = withoutTask.findIndex((t) => t.id === afterTaskId);
        } else {
          newIndex = 0;
        }
        queryClient.setQueryData(queryKey, [...withoutTask.slice(0, newIndex), task, ...withoutTask.slice(newIndex)]);
      }
    }),
  });

  const toggleFav = useMutation({
    mutationFn: async (id: string) => {
      const result = await toggleFavorite({ id });
      if (!result.success) throw new Error(result.error);
      return result.data.task;
    },
    ...withOptimistic<string>((id) => {
      updateAllTasksCache((task) => (task.id === id ? { ...task, isFavorite: !task.isFavorite } : task));
    }),
  });

  return {
    createTask: create,
    updateTask: update,
    completeTask: complete,
    uncompleteTask: uncomplete,
    skipTask: skip,
    unskipTask: unskip,
    deleteTask: remove,
    reorderTasks: reorder,
    toggleFavorite: toggleFav,
  };
}
