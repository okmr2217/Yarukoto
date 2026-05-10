"use client";

import { useState, useCallback } from "react";
import { readBoolRecord, saveBoolRecord } from "@/lib/local-storage";

const STORAGE_KEY = "yarukoto:categoryGroupCollapsed";

export type GroupSelectionState = "all" | "partial" | "none";

export function getGroupSelectionState(groupCategoryIds: string[], selectedCategoryIds: string[]): GroupSelectionState {
  if (groupCategoryIds.length === 0) return "none";
  const selectedCount = groupCategoryIds.filter((id) => selectedCategoryIds.includes(id)).length;
  if (selectedCount === 0) return "none";
  if (selectedCount === groupCategoryIds.length) return "all";
  return "partial";
}

export function useCategoryGroupCollapsed() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => readBoolRecord(STORAGE_KEY));

  const toggleCollapse = useCallback((groupId: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      saveBoolRecord(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { collapsed, toggleCollapse };
}
