"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { searchTasks } from "@/actions";
import type { SearchTasksResult } from "@/types";
import type { SearchTasksInput } from "@/lib/validations/task";

export type SearchFilters = {
  keyword: string;
  status: "all" | "pending" | "completed" | "skipped";
  categoryId: string | null | undefined;
  isFavorite: boolean | undefined;
  dateFrom: string | undefined;
  dateTo: string | undefined;
};

const defaultFilters: SearchFilters = {
  keyword: "",
  status: "all",
  categoryId: undefined,
  isFavorite: undefined,
  dateFrom: undefined,
  dateTo: undefined,
};

export function useSearchTasks(filters: Partial<SearchFilters> = {}) {
  const mergedFilters = { ...defaultFilters, ...filters };

  // Only enable the query when there are actual filter criteria
  const hasSearchCriteria =
    mergedFilters.keyword.trim() !== "" ||
    mergedFilters.status !== "all" ||
    mergedFilters.categoryId !== undefined ||
    mergedFilters.isFavorite !== undefined ||
    mergedFilters.dateFrom !== undefined ||
    mergedFilters.dateTo !== undefined;

  return useQuery({
    queryKey: ["searchTasks", mergedFilters],
    queryFn: async (): Promise<SearchTasksResult> => {
      const input: SearchTasksInput = {};

      if (mergedFilters.keyword.trim()) {
        input.keyword = mergedFilters.keyword.trim();
      }
      if (mergedFilters.status !== "all") {
        input.status = mergedFilters.status;
      }
      if (mergedFilters.categoryId !== undefined) {
        input.categoryId = mergedFilters.categoryId;
      }
      if (mergedFilters.isFavorite !== undefined) {
        input.isFavorite = mergedFilters.isFavorite;
      }
      if (mergedFilters.dateFrom) {
        input.dateFrom = mergedFilters.dateFrom;
      }
      if (mergedFilters.dateTo) {
        input.dateTo = mergedFilters.dateTo;
      }

      const result = await searchTasks(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: hasSearchCriteria,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useInvalidateSearchTasks() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["searchTasks"] });
  };
}
