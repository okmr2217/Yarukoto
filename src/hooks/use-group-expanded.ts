"use client";

import { useState, useCallback } from "react";
import { readBoolRecord, saveBoolRecord } from "@/lib/local-storage";

const STORAGE_KEY = "yarukoto:sidebar:groupExpanded";

export function useGroupExpanded() {
  const [state, setState] = useState<Record<string, boolean>>(() => readBoolRecord(STORAGE_KEY));

  const isExpanded = useCallback((id: string) => state[id] !== false, [state]);

  const toggle = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, [id]: prev[id] === false };
      saveBoolRecord(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { isExpanded, toggle };
}
