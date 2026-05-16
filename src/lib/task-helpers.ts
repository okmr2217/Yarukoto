import type { Task as PrismaTask, Category } from "@/generated/prisma/client";
import type { Task } from "@/types";
import { formatDateToJST } from "@/lib/dateUtils";

type CategoryWithGroup = Category & { group?: { color: string | null } | null };

export function toTask(task: PrismaTask & { category: CategoryWithGroup | null }): Task {
  return {
    id: task.id,
    title: task.title,
    memo: task.memo,
    status: task.status,
    isFavorite: task.isFavorite,
    scheduledAt: task.scheduledAt ? formatDateToJST(task.scheduledAt) : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    skippedAt: task.skippedAt ? task.skippedAt.toISOString() : null,
    skipReason: task.skipReason,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    categoryId: task.categoryId,
    category: task.category
      ? {
          id: task.category.id,
          name: task.category.name,
          color: task.category.color,
          groupColor: task.category.group?.color ?? null,
        }
      : null,
  };
}
