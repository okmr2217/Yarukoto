"use client";

import { useQuery } from "@tanstack/react-query";
import { getCategoryTaskCounts } from "@/actions";
import type { CategoryTaskCounts } from "@/types";
import type { GetCategoryTaskCountsInput } from "@/lib/validations";

const REFETCH_INTERVAL_MS = 60_000;

export function useCategoryTaskCounts(filters: GetCategoryTaskCountsInput, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["categoryTaskCounts", filters],
    queryFn: async (): Promise<CategoryTaskCounts> => {
      const result = await getCategoryTaskCounts(filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });
}
