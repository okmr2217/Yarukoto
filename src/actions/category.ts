"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-server";
import { type ActionResult, success, failure, type Category, type CategoryStats } from "@/types";
import { getTodayInJST, formatDateToJST } from "@/lib/dateUtils";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  updateCategorySortOrderSchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type UpdateCategorySortOrderInput,
} from "@/lib/validations";
import type { Category as PrismaCategory } from "@/generated/prisma/client";

// Helper: Convert Prisma category to API category type
function toCategory(category: PrismaCategory): Category {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    description: category.description,
    sortOrder: category.sortOrder,
    archivedAt: category.archivedAt?.toISOString() ?? null,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export async function getCategories(): Promise<
  ActionResult<{ categories: Category[] }>
> {
  try {
    const user = await getRequiredUser();

    const categories = await prisma.category.findMany({
      where: { userId: user.id, archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return success({ categories: categories.map(toCategory) });
  } catch (error) {
    console.error("getCategories error:", error);
    return failure("カテゴリの取得に失敗しました", "INTERNAL_ERROR");
  }
}

export async function getArchivedCategories(): Promise<
  ActionResult<{ categories: Category[] }>
> {
  try {
    const user = await getRequiredUser();

    const categories = await prisma.category.findMany({
      where: { userId: user.id, archivedAt: { not: null } },
      orderBy: [{ archivedAt: "desc" }],
    });

    return success({ categories: categories.map(toCategory) });
  } catch (error) {
    console.error("getArchivedCategories error:", error);
    return failure("カテゴリの取得に失敗しました", "INTERNAL_ERROR");
  }
}

export async function archiveCategory(input: {
  id: string;
}): Promise<ActionResult<{ category: Category }>> {
  try {
    const parsed = categoryIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    const existing = await prisma.category.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return failure("カテゴリが見つかりません", "NOT_FOUND");
    }

    const category = await prisma.category.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    return success({ category: toCategory(category) });
  } catch (error) {
    console.error("archiveCategory error:", error);
    return failure("カテゴリのアーカイブに失敗しました", "INTERNAL_ERROR");
  }
}

export async function unarchiveCategory(input: {
  id: string;
}): Promise<ActionResult<{ category: Category }>> {
  try {
    const parsed = categoryIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    const existing = await prisma.category.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return failure("カテゴリが見つかりません", "NOT_FOUND");
    }

    const category = await prisma.category.update({
      where: { id },
      data: { archivedAt: null },
    });

    return success({ category: toCategory(category) });
  } catch (error) {
    console.error("unarchiveCategory error:", error);
    return failure("カテゴリの復元に失敗しました", "INTERNAL_ERROR");
  }
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<ActionResult<{ category: Category }>> {
  try {
    const parsed = createCategorySchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { name, color, description } = parsed.data;

    // Check for duplicate name
    const existing = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: { equals: name.trim(), mode: "insensitive" },
      },
    });
    if (existing) {
      return failure("同じ名前のカテゴリが既に存在します", "CONFLICT");
    }

    const maxSortOrder = await prisma.category.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        color,
        description: description ?? null,
        sortOrder: nextSortOrder,
        userId: user.id,
      },
    });

    return success({ category: toCategory(category) });
  } catch (error) {
    console.error("createCategory error:", error);
    return failure("カテゴリの作成に失敗しました", "INTERNAL_ERROR");
  }
}

export async function updateCategory(
  input: UpdateCategoryInput,
): Promise<ActionResult<{ category: Category }>> {
  try {
    const parsed = updateCategorySchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id, name, color, description } = parsed.data;

    // Verify category belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingCategory) {
      return failure("カテゴリが見つかりません", "NOT_FOUND");
    }

    // Check for duplicate name if name is being changed
    if (
      name &&
      name.trim().toLowerCase() !== existingCategory.name.toLowerCase()
    ) {
      const duplicate = await prisma.category.findFirst({
        where: {
          userId: user.id,
          name: { equals: name.trim(), mode: "insensitive" },
          id: { not: id },
        },
      });
      if (duplicate) {
        return failure("同じ名前のカテゴリが既に存在します", "CONFLICT");
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return success({ category: toCategory(category) });
  } catch (error) {
    console.error("updateCategory error:", error);
    return failure("カテゴリの更新に失敗しました", "INTERNAL_ERROR");
  }
}

export async function updateCategorySortOrder(
  input: UpdateCategorySortOrderInput,
): Promise<ActionResult<{ success: true }>> {
  try {
    const parsed = updateCategorySortOrderSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { updates } = parsed.data;

    // Verify all categories belong to the user
    const ids = updates.map((u) => u.id);
    const owned = await prisma.category.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true },
    });
    if (owned.length !== ids.length) {
      return failure("カテゴリが見つかりません", "NOT_FOUND");
    }

    await prisma.$transaction(
      updates.map(({ id, sortOrder }) =>
        prisma.category.update({ where: { id }, data: { sortOrder } }),
      ),
    );

    return success({ success: true });
  } catch (error) {
    console.error("updateCategorySortOrder error:", error);
    return failure("カテゴリの並び替えに失敗しました", "INTERNAL_ERROR");
  }
}

export async function getCategoryStats(): Promise<ActionResult<CategoryStats[]>> {
  try {
    const user = await getRequiredUser();
    const today = getTodayInJST();

    const [categories, tasks] = await Promise.all([
      prisma.category.findMany({
        where: { userId: user.id },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.task.findMany({
        where: { userId: user.id },
        select: { categoryId: true, status: true, scheduledAt: true },
      }),
    ]);

    const map = new Map<string | null, CategoryStats>();

    // カテゴリの表示順で初期化（アーカイブ済み含む）
    for (const c of categories) {
      map.set(c.id, {
        categoryId: c.id,
        name: c.name,
        color: c.color,
        total: 0,
        completed: 0,
        skipped: 0,
        overdue: 0,
      });
    }
    // カテゴリなしを末尾に追加
    map.set(null, { categoryId: null, name: "カテゴリなし", color: null, total: 0, completed: 0, skipped: 0, overdue: 0 });

    for (const task of tasks) {
      const key = task.categoryId;
      // アーカイブ済みカテゴリのタスクはカテゴリなしに集計
      const statsKey = map.has(key) ? key : null;
      const stats = map.get(statsKey)!;
      stats.total++;
      if (task.status === "COMPLETED") stats.completed++;
      if (task.status === "SKIPPED") stats.skipped++;
      if (task.status === "PENDING" && task.scheduledAt && formatDateToJST(task.scheduledAt) < today) {
        stats.overdue++;
      }
    }

    return success(Array.from(map.values()));
  } catch (error) {
    console.error("getCategoryStats error:", error);
    return failure("カテゴリ統計の取得に失敗しました", "INTERNAL_ERROR");
  }
}

export async function deleteCategory(input: {
  id: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = categoryIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    // Verify category belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingCategory) {
      return failure("カテゴリが見つかりません", "NOT_FOUND");
    }

    // Delete category (tasks will have categoryId set to null via onDelete: SetNull)
    await prisma.category.delete({ where: { id } });

    return success({ id });
  } catch (error) {
    console.error("deleteCategory error:", error);
    return failure("カテゴリの削除に失敗しました", "INTERNAL_ERROR");
  }
}
