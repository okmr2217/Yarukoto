"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-server";
import { type ActionResult, success, failure, type Group } from "@/types";
import {
  createGroupSchema,
  updateGroupSchema,
  groupIdSchema,
  updateGroupSortOrderSchema,
  type CreateGroupInput,
  type UpdateGroupInput,
  type UpdateGroupSortOrderInput,
} from "@/lib/validations";
import type { Group as PrismaGroup } from "@/generated/prisma/client";

type PrismaGroupWithCount = PrismaGroup & { _count: { categories: number } };

function toGroup(group: PrismaGroupWithCount): Group {
  return {
    id: group.id,
    name: group.name,
    color: group.color,
    sortOrder: group.sortOrder,
    categoryCount: group._count.categories,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

export async function getGroups(): Promise<ActionResult<{ groups: Group[] }>> {
  try {
    const user = await getRequiredUser();
    const groups = await prisma.group.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { categories: true } } },
    });
    return success({ groups: groups.map(toGroup) });
  } catch (error) {
    console.error("getGroups error:", error);
    return failure("グループの取得に失敗しました", "INTERNAL_ERROR");
  }
}

export async function createGroup(input: CreateGroupInput): Promise<ActionResult<{ group: Group }>> {
  try {
    const parsed = createGroupSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { name, color } = parsed.data;

    const existing = await prisma.group.findFirst({
      where: { userId: user.id, name: { equals: name.trim(), mode: "insensitive" } },
    });
    if (existing) {
      return failure("同じ名前のグループが既に存在します", "CONFLICT");
    }

    const maxSortOrder = await prisma.group.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    const group = await prisma.group.create({
      data: { name: name.trim(), color: color ?? null, sortOrder: nextSortOrder, userId: user.id },
      include: { _count: { select: { categories: true } } },
    });

    return success({ group: toGroup(group) });
  } catch (error) {
    console.error("createGroup error:", error);
    return failure("グループの作成に失敗しました", "INTERNAL_ERROR");
  }
}

export async function updateGroup(input: UpdateGroupInput): Promise<ActionResult<{ group: Group }>> {
  try {
    const parsed = updateGroupSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id, name, color } = parsed.data;

    const existingGroup = await prisma.group.findFirst({ where: { id, userId: user.id } });
    if (!existingGroup) {
      return failure("グループが見つかりません", "NOT_FOUND");
    }

    if (name && name.trim().toLowerCase() !== existingGroup.name.toLowerCase()) {
      const duplicate = await prisma.group.findFirst({
        where: { userId: user.id, name: { equals: name.trim(), mode: "insensitive" }, id: { not: id } },
      });
      if (duplicate) {
        return failure("同じ名前のグループが既に存在します", "CONFLICT");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;

    const group = await prisma.group.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { categories: true } } },
    });

    return success({ group: toGroup(group) });
  } catch (error) {
    console.error("updateGroup error:", error);
    return failure("グループの更新に失敗しました", "INTERNAL_ERROR");
  }
}

export async function deleteGroup(input: { id: string }): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = groupIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    const existingGroup = await prisma.group.findFirst({ where: { id, userId: user.id } });
    if (!existingGroup) {
      return failure("グループが見つかりません", "NOT_FOUND");
    }

    await prisma.group.delete({ where: { id } });
    return success({ id });
  } catch (error) {
    console.error("deleteGroup error:", error);
    return failure("グループの削除に失敗しました", "INTERNAL_ERROR");
  }
}

export async function reorderGroups(input: UpdateGroupSortOrderInput): Promise<ActionResult<{ success: true }>> {
  try {
    const parsed = updateGroupSortOrderSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { updates } = parsed.data;

    const ids = updates.map((u) => u.id);
    const owned = await prisma.group.findMany({ where: { id: { in: ids }, userId: user.id }, select: { id: true } });
    if (owned.length !== ids.length) {
      return failure("グループが見つかりません", "NOT_FOUND");
    }

    await prisma.$transaction(
      updates.map(({ id, sortOrder }) => prisma.group.update({ where: { id }, data: { sortOrder } })),
    );

    return success({ success: true });
  } catch (error) {
    console.error("reorderGroups error:", error);
    return failure("グループの並び替えに失敗しました", "INTERNAL_ERROR");
  }
}
