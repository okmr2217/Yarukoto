"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDueDateAlerts } from "@/hooks";

export function DueDateAlertChip({ className }: { className?: string }) {
  const { overdueCount, todayCount } = useDueDateAlerts();

  if (overdueCount === 0 && todayCount === 0) return null;

  return (
    <Link
      href="/?view=schedule"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border",
        "bg-background hover:bg-muted transition-colors text-xs",
        className,
      )}
      aria-label={`期限アラート: 期限切れ${overdueCount}件、今日が期限${todayCount}件`}
    >
      <Bell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      {overdueCount > 0 && (
        <>
          <span className="w-px h-3 bg-border" />
          <span className="font-medium text-destructive">{overdueCount}</span>
        </>
      )}
      {todayCount > 0 && (
        <>
          <span className="w-px h-3 bg-border" />
          <span className="font-medium text-amber-600 dark:text-amber-400">{todayCount}</span>
        </>
      )}
    </Link>
  );
}
