"use client";

import { useQuery } from "@tanstack/react-query";
import { getCategoryGroupStats } from "@/actions";

export function useCategoryGroupStats() {
  return useQuery({
    queryKey: ["categoryGroupStats"],
    queryFn: async () => {
      const result = await getCategoryGroupStats();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
