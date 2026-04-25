"use client";

import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { LinkText } from "@/components/ui/link-text";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { Task } from "@/types";
import {
  Ban,
  GripVertical,
  Star,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { getScheduledDateStatus, formatCompactTime, formatRelativeScheduledDate } from "@/lib/dateUtils";

export interface TaskCardHandlers {
  onOpen: (task: Task) => void;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

interface TaskCardProps {
  task: Task;
  handlers: TaskCardHandlers;
  showScheduledDate?: boolean;
  enableDragAndDrop?: boolean;
  dragHandleListeners?: DraggableSyntheticListeners;
  dragHandleAttributes?: DraggableAttributes;
  matchReasons?: string[];
}

function StopPropagation({ children }: { children: React.ReactNode }) {
  return (
    <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

interface TaskCardMetaProps {
  task: Task;
  showScheduledDate: boolean;
  scheduledDateStatus: "today" | "overdue" | "future" | null;
  hasMemo: boolean;
}

function TaskCardMeta({ task, showScheduledDate, scheduledDateStatus, hasMemo }: TaskCardMetaProps) {
  const isSkipped = task.status === "SKIPPED";
  const hasRow1 = (showScheduledDate && task.scheduledAt) || (isSkipped && task.skipReason);
  if (!hasRow1) return null;

  return (
    <div className={cn("flex flex-col gap-1", hasMemo ? "mt-2" : "mt-1")}>
      <div className="flex items-center gap-1.5 flex-wrap">
        {showScheduledDate && task.scheduledAt && (
          <>
            {scheduledDateStatus === "today" && (
              <span className="flex items-center gap-1 text-primary text-xs font-medium">
                <Calendar className="h-3 w-3" />
                今日
              </span>
            )}
            {scheduledDateStatus === "overdue" && (
              <span className="flex items-center gap-1 bg-destructive/10 text-destructive text-xs px-2 py-0.5 rounded-full font-medium">
                <AlertCircle className="h-3 w-3" />
                {formatRelativeScheduledDate(task.scheduledAt!)}
              </span>
            )}
            {scheduledDateStatus === "future" && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <Calendar className="h-3 w-3" />
                {formatRelativeScheduledDate(task.scheduledAt!)}
              </span>
            )}
          </>
        )}
        {isSkipped && task.skipReason && (
          <span className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 text-xs px-2 py-0.5 rounded-full">
            <Ban className="h-3 w-3" />
            {task.skipReason}
          </span>
        )}
      </div>
    </div>
  );
}

export function TaskCard({
  task,
  handlers,
  showScheduledDate = false,
  enableDragAndDrop = false,
  dragHandleListeners,
  dragHandleAttributes,
  matchReasons,
}: TaskCardProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const isCompleted = task.status === "COMPLETED";
  const isSkipped = task.status === "SKIPPED";
  const hasMemo = !!task.memo;

  const scheduledDateStatus = useMemo(() => getScheduledDateStatus(task.scheduledAt), [task.scheduledAt]);

  const timeEntries = useMemo(() => {
    const entries = [
      {
        Icon: Clock,
        timestamp: task.createdAt,
        className: "text-muted-foreground/50",
        bold: matchReasons?.includes("この日に作成") ?? false,
      },
    ];
    if (isCompleted && task.completedAt) {
      entries.push({
        Icon: CheckCircle2,
        timestamp: task.completedAt,
        className: "text-success",
        bold: matchReasons?.includes("この日に完了") ?? false,
      });
    }
    if (isSkipped && task.skippedAt) {
      entries.push({
        Icon: Ban,
        timestamp: task.skippedAt,
        className: "text-yellow-600",
        bold: matchReasons?.includes("この日にやらない") ?? false,
      });
    }
    return entries;
  }, [isCompleted, isSkipped, task.completedAt, task.skippedAt, task.createdAt, matchReasons]);

  const handleCheckChange = (checked: boolean) => {
    if (checked) {
      setIsFlashing(true);
      handlers.onComplete(task.id);
      setTimeout(() => setIsFlashing(false), 600);
    } else {
      handlers.onUncomplete(task.id);
    }
  };

  return (
    <div
      className={cn("flex group hover:bg-accent/40 transition-colors duration-150 cursor-pointer", isFlashing && "bg-success/10")}
      onClick={() => handlers.onOpen(task)}
    >
      {enableDragAndDrop && (
        <div
          className="flex items-center justify-center w-6 shrink-0 bg-muted/50 cursor-grab active:cursor-grabbing touch-none text-muted-foreground/50"
          aria-label="ドラッグして並び替え"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          {...dragHandleListeners}
          {...dragHandleAttributes}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 px-3 py-1.5">
        {/* 上段：チェックボックス・時間・★ */}
        <div className="flex items-center gap-2">
          <StopPropagation>
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleCheckChange}
              disabled={isSkipped || isFlashing}
            />
          </StopPropagation>
          <div className="flex items-center gap-2 flex-wrap">
            {timeEntries.map((entry, i) => (
              <span key={i} className={cn("flex items-center gap-0.75 text-xs", entry.className, entry.bold && "font-bold")}>
                <entry.Icon className="h-3 w-3 translate-y-[0.25px]" />
                {formatCompactTime(entry.timestamp)}
              </span>
            ))}
          </div>
          <div className="flex-1" />
          <StopPropagation>
            <button
              onClick={() => handlers.onToggleFavorite(task.id)}
              className={cn(
                "p-1.5 rounded transition-colors hover:bg-accent",
                task.isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500",
              )}
              aria-label={task.isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
            >
              <Star className="h-3.5 w-3.5" fill={task.isFavorite ? "currentColor" : "none"} />
            </button>
          </StopPropagation>
        </div>

        {/* 区切り線 */}
        <div className="border-t border-border/40 my-0.5" />

        {/* 下段：タスク名・メモ・メタ情報 */}
        <div className="pl-6 pt-1 pb-0.5">
          <div className="flex items-start gap-1.5">
            {task.category?.color && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="w-2 h-2 rounded-full shrink-0 mt-1.75 cursor-default"
                    style={{ backgroundColor: task.category.color }}
                  />
                </TooltipTrigger>
                <TooltipContent>{task.category.name}</TooltipContent>
              </Tooltip>
            )}
            <p className={cn("text-sm font-medium", (isCompleted || isSkipped) && "text-muted-foreground")}>
              {task.title}
            </p>
          </div>

          {hasMemo && (
            <div className="text-xs text-muted-foreground whitespace-pre-wrap mt-1.5">
              <LinkText text={task.memo!} />
            </div>
          )}

          <TaskCardMeta
            task={task}
            showScheduledDate={showScheduledDate}
            scheduledDateStatus={scheduledDateStatus}
            hasMemo={hasMemo}
          />
        </div>
      </div>
    </div>
  );
}
