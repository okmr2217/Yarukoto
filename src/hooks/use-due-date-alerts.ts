"use client";

import { useMemo } from "react";
import { useAllTasks } from "./use-all-tasks";
import { getTodayInJST } from "@/lib/dateUtils";

export interface DueDateAlerts {
  overdueCount: number;
  todayCount: number;
}

export function useDueDateAlerts(): DueDateAlerts {
  const { data: tasks } = useAllTasks();

  return useMemo(() => {
    if (!tasks) return { overdueCount: 0, todayCount: 0 };
    const today = getTodayInJST();

    let overdueCount = 0;
    let todayCount = 0;

    for (const task of tasks) {
      if (task.status !== "PENDING") continue;
      if (!task.scheduledAt) continue;

      if (task.scheduledAt < today) overdueCount++;
      else if (task.scheduledAt === today) todayCount++;
    }

    return { overdueCount, todayCount };
  }, [tasks]);
}
