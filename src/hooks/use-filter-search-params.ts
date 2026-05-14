"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getTodayInJST } from "@/lib/dateUtils";
import type { StatusFilter } from "@/lib/filter-types";

export function useFilterSearchParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getTodayInJST();

  const dateFilter = searchParams.get("date") || "";
  const keyword = searchParams.get("keyword") || "";
  const statusFilter = (searchParams.get("status") || "pending") as StatusFilter;
  const favoriteFilter = searchParams.get("favorite") === "true";

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.push(qs ? `/?${qs}` : "/");
    },
    [searchParams, router],
  );

  return { dateFilter, keyword, statusFilter, favoriteFilter, updateSearchParams, today };
}
