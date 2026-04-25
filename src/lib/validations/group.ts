import { z } from "zod";
import { GROUP_CONSTANTS } from "@/lib/constants";

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "カラーコードは#RRGGBB形式で入力してください");

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, "グループ名を入力してください")
    .max(GROUP_CONSTANTS.NAME_MAX_LENGTH, `グループ名は${GROUP_CONSTANTS.NAME_MAX_LENGTH}文字以内で入力してください`)
    .refine((val) => val.trim().length > 0, "グループ名を入力してください"),
  color: hexColorSchema.optional(),
});

export const updateGroupSchema = z.object({
  id: z.string().min(1, "グループIDは必須です"),
  name: z
    .string()
    .min(1, "グループ名を入力してください")
    .max(GROUP_CONSTANTS.NAME_MAX_LENGTH, `グループ名は${GROUP_CONSTANTS.NAME_MAX_LENGTH}文字以内で入力してください`)
    .refine((val) => val.trim().length > 0, "グループ名を入力してください")
    .optional(),
  color: hexColorSchema.nullable().optional(),
});

export const groupIdSchema = z.object({
  id: z.string().min(1, "グループIDは必須です"),
});

export const updateGroupSortOrderSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type UpdateGroupSortOrderInput = z.infer<typeof updateGroupSortOrderSchema>;
