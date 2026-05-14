"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getRequiredUser } from "@/lib/auth-server";

type TaskWithCategory = Prisma.TaskGetPayload<{ include: { category: true } }>;
import {
  type ActionResult,
  success,
  failure,
  type Task,
  type MonthlyTaskStats,
} from "@/types";
import {
  getMonthlyTaskStatsSchema,
  getAllTasksSchema,
  type GetMonthlyTaskStatsInput,
  type GetAllTasksInput,
} from "@/lib/validations";
import {
  getTodayInJST,
  getDateRangeInJST,
  getMonthRangeInJST,
  formatDateToJST,
} from "@/lib/dateUtils";
import { ERROR_MESSAGES } from "@/lib/constants";
import { toTask } from "@/lib/task-helpers";

/**
 * すべてのタスクを取得します。フィルタ条件を複合指定可能。
 *
 * @param input - フィルタ条件
 * @returns タスク一覧（displayOrder降順にソート）
 *
 * @remarks
 * - `date` 指定時: scheduledAt が一致、または completedAt/skippedAt/createdAt が JST でその日に該当するタスクを返す
 * - `keyword` 指定時: タイトル・メモを大文字小文字を区別せずに検索
 * - displayOrderが大きい値ほど上に表示されます
 */
export async function getAllTasks(input?: GetAllTasksInput): Promise<ActionResult<Task[]>> {
  try {
    const parsed = getAllTasksSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { categoryIds, date, keyword, status, isFavorite } = parsed.data;

    const andConditions: Prisma.TaskWhereInput[] = [
      { OR: [{ categoryId: null }, { category: { archivedAt: null } }] },
    ];

    // 単日フィルタ: scheduledAt 一致 OR completedAt/skippedAt/createdAt がその日の範囲内
    if (date) {
      const { start, end } = getDateRangeInJST(date);
      const dateObj = new Date(date);
      andConditions.push({
        OR: [
          { scheduledAt: dateObj },
          { completedAt: { gte: start, lte: end } },
          { skippedAt: { gte: start, lte: end } },
          { createdAt: { gte: start, lte: end } },
        ],
      });
    }

    // キーワード検索（タイトルまたはメモに含まれる）
    if (keyword?.trim()) {
      andConditions.push({
        OR: [
          { title: { contains: keyword.trim(), mode: "insensitive" } },
          { memo: { contains: keyword.trim(), mode: "insensitive" } },
        ],
      });
    }

    // カテゴリフィルタ（複数選択 OR 検索）
    let categoryFilter: Prisma.TaskWhereInput["categoryId"] = undefined;
    if (categoryIds && categoryIds.length > 0) {
      const hasNone = categoryIds.includes("none");
      const regularIds = categoryIds.filter((id) => id !== "none");
      if (hasNone && regularIds.length > 0) {
        andConditions.push({ OR: [{ categoryId: { in: regularIds } }, { categoryId: null }] });
      } else if (hasNone) {
        categoryFilter = null;
      } else {
        categoryFilter = { in: regularIds };
      }
    }

    const where: Prisma.TaskWhereInput = {
      userId: user.id,
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
      ...(categoryFilter !== undefined ? { categoryId: categoryFilter } : {}),
      ...(status && status !== "all" ? { status: status.toUpperCase() as Prisma.EnumTaskStatusFilter["equals"] } : {}),
      ...(isFavorite !== undefined ? { isFavorite } : {}),
    };

    const tasks = await prisma.task.findMany({
      where,
      include: { category: true },
      orderBy: { displayOrder: "desc" },
    });

    return success(tasks.map(toTask));
  } catch (error) {
    console.error("getAllTasks error:", error);
    return failure(ERROR_MESSAGES.TASK_FETCH_FAILED, "INTERNAL_ERROR");
  }
}

/**
 * 指定月のタスク統計を取得します。
 *
 * @param input - 取得する月（YYYY-MM形式）
 * @returns 日付別のタスク統計（合計、完了、遅延、スキップの数）
 *
 * @remarks
 * - 統計には、その月に予定・完了・スキップされたすべてのタスクが含まれます
 * - 遅延は、今日時点で未完了かつ過去に予定されたタスクです
 * - すべての日付処理はJST（日本標準時）基準で行われます
 */
function aggregateMonthlyStats(tasks: TaskWithCategory[], firstDay: Date, lastDay: Date, today: string): MonthlyTaskStats {
  const stats: MonthlyTaskStats = {};
  const completedCategoriesMap = new Map<string, Map<string, { id: string; name: string; color: string | null }>>();

  for (const task of tasks) {
    const dates = new Set<string>();

    if (task.scheduledAt && task.scheduledAt >= firstDay && task.scheduledAt <= lastDay) {
      dates.add(formatDateToJST(task.scheduledAt));
    }
    if (task.completedAt && task.completedAt >= firstDay && task.completedAt <= lastDay) {
      dates.add(formatDateToJST(task.completedAt));
    }
    if (task.skippedAt && task.skippedAt >= firstDay && task.skippedAt <= lastDay) {
      dates.add(formatDateToJST(task.skippedAt));
    }
    if (task.createdAt >= firstDay && task.createdAt <= lastDay) {
      dates.add(formatDateToJST(task.createdAt));
    }

    for (const dateStr of dates) {
      if (!stats[dateStr]) {
        stats[dateStr] = { total: 0, completed: 0, createdCount: 0, overdue: 0, skipped: 0 };
      }

      const scheduledDateStr = task.scheduledAt ? formatDateToJST(task.scheduledAt) : null;
      if (scheduledDateStr === dateStr) {
        stats[dateStr].total++;
        if (task.status === "PENDING" && dateStr < today) stats[dateStr].overdue++;
      }

      const completedDateStr = task.completedAt ? formatDateToJST(task.completedAt) : null;
      if (completedDateStr === dateStr) {
        stats[dateStr].completed++;
        if (task.category) {
          if (!completedCategoriesMap.has(dateStr)) completedCategoriesMap.set(dateStr, new Map());
          const catMap = completedCategoriesMap.get(dateStr)!;
          if (!catMap.has(task.category.id)) {
            catMap.set(task.category.id, { id: task.category.id, name: task.category.name, color: task.category.color });
          }
        }
      }

      const skippedDateStr = task.skippedAt ? formatDateToJST(task.skippedAt) : null;
      if (skippedDateStr === dateStr) stats[dateStr].skipped++;

      if (formatDateToJST(task.createdAt) === dateStr) stats[dateStr].createdCount++;
    }
  }

  for (const [dateStr, catMap] of completedCategoriesMap.entries()) {
    if (stats[dateStr]) stats[dateStr].completedCategories = Array.from(catMap.values());
  }

  return stats;
}

export async function getMonthlyTaskStats(
  input: GetMonthlyTaskStatsInput,
): Promise<ActionResult<MonthlyTaskStats>> {
  try {
    const parsed = getMonthlyTaskStatsSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { month } = parsed.data;
    const today = getTodayInJST();
    const { start: firstDay, end: lastDay } = getMonthRangeInJST(month);

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        OR: [
          { scheduledAt: { gte: firstDay, lte: lastDay } },
          { completedAt: { gte: firstDay, lte: lastDay } },
          { skippedAt: { gte: firstDay, lte: lastDay } },
          { createdAt: { gte: firstDay, lte: lastDay } },
        ],
      },
      include: { category: true },
    });

    return success(aggregateMonthlyStats(tasks, firstDay, lastDay, today));
  } catch (error) {
    console.error("getMonthlyTaskStats error:", error);
    return failure(ERROR_MESSAGES.TASK_STATS_FAILED, "INTERNAL_ERROR");
  }
}
