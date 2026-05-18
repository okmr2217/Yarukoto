export type Category = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  sortOrder: number;
  archivedAt: string | null;
  groupId: string | null;
  group: { id: string; name: string; emoji: string | null; color: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryStats = {
  categoryId: string | null;
  name: string;
  color: string | null;
  total: number;
  completed: number;
  skipped: number;
  overdue: number;
};

export type GroupStats = {
  id: string | null;
  name: string;
  emoji: string | null;
  color: string | null;
  sortOrder: number;
  categories: CategoryStats[];
  totalTasks: number;
  totalCompleted: number;
  totalSkipped: number;
  avgCompletionRate: number;
};

export type Group = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  sortOrder: number;
  categoryCount: number;
  createdAt: string;
  updatedAt: string;
};
