"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "yarukoto:categoryGroupCollapsed";

export type GroupSelectionState = "all" | "partial" | "none";

export function getGroupSelectionState(groupCategoryIds: string[], selectedCategoryIds: string[]): GroupSelectionState {
  if (groupCategoryIds.length === 0) return "none";
  const selectedCount = groupCategoryIds.filter((id) => selectedCategoryIds.includes(id)).length;
  if (selectedCount === 0) return "none";
  if (selectedCount === groupCategoryIds.length) return "all";
  return "partial";
}

function readCollapsedFromStorage(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function useCategoryGroupCollapsed() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(readCollapsedFromStorage);

  const toggleCollapse = useCallback((groupId: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { collapsed, toggleCollapse };
}
