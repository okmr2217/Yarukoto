"use client";

import { useQuery } from "@tanstack/react-query";
import { getCategoryStats } from "@/actions";

export function useCategoryStats() {
  return useQuery({
    queryKey: ["categoryStats"],
    queryFn: async () => {
      const result = await getCategoryStats();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
