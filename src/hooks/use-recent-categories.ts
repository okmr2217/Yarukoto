"use client";

import { useCallback } from "react";

const STORAGE_KEY = "yarukoto:recentCategoryIds";
const MAX_RECENT = 5;

function readRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useRecentCategories() {
  const getRecentIds = useCallback((): string[] => {
    return readRecentIds();
  }, []);

  const recordRecentCategory = useCallback((categoryId: string) => {
    const current = readRecentIds().filter((id) => id !== categoryId);
    const next = [categoryId, ...current].slice(0, MAX_RECENT);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable — ignore
    }
  }, []);

  return { getRecentIds, recordRecentCategory };
}
