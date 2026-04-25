"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "yarukoto:sidebar:groupExpanded";

function readFromStorage(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function useGroupExpanded() {
  const [state, setState] = useState<Record<string, boolean>>(readFromStorage);

  const isExpanded = useCallback((id: string) => state[id] !== false, [state]);

  const toggle = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, [id]: prev[id] === false };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // fallback to in-memory state only
      }
      return next;
    });
  }, []);

  return { isExpanded, toggle };
}
