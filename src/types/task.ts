import type { TaskStatus } from "@/generated/prisma/client";

export type { TaskStatus } from "@/generated/prisma/client";

export type CategorySummary = {
  id: string;
  name: string;
  color: string | null;
  groupColor: string | null;
};

export type Task = {
  id: string;
  title: string;
  memo: string | null;
  status: TaskStatus;
  isFavorite: boolean;
  scheduledAt: string | null;
  completedAt: string | null;
  skippedAt: string | null;
  skipReason: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  category: CategorySummary | null;
};

export type TaskGroup = {
  date: string | null;
  tasks: Task[];
};

export type DayTaskStats = {
  total: number;
  completed: number;
  createdCount: number;
  overdue: number;
  skipped: number;
  completedCategories?: CategorySummary[];
};

export type MonthlyTaskStats = {
  [date: string]: DayTaskStats;
};

export type CategoryTaskCounts = {
  byCategoryId: Record<string, number>;
  byGroupId: Record<string, number>;
};

