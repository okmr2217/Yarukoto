"use client";

import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { LinkText } from "@/components/ui/link-text";
import type { Task } from "@/types";
import {
  Ban,
  GripVertical,
  Calendar,
  CheckCircle2,
  PlusCircle,
  PenLine,
  Star,
} from "lucide-react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { getScheduledDateStatus, formatCompactTime, formatRelativeScheduledDate } from "@/lib/dateUtils";
import { useLongPress } from "@/hooks/useLongPress";

export interface TaskCardHandlers {
  onOpenDetail: (task: Task) => void;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onSkip: (id: string) => void;
  onUnskip: (id: string) => void;
  onDelete: (id: string) => void;
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

function ScheduledDateChip({ scheduledAt, status }: { scheduledAt: string; status: ReturnType<typeof getScheduledDateStatus> }) {
  const textClass =
    status === "today" ? "text-primary" : status === "overdue" ? "text-destructive" : "text-muted-foreground";
  const label = status === "today" ? "今日" : formatRelativeScheduledDate(scheduledAt);
  return (
    <span className={cn("flex items-center gap-1 bg-muted/60 text-xs px-2 py-0.5 rounded-full shrink-0", textClass)}>
      <Calendar className="h-3 w-3" />
      {label}
    </span>
  );
}

function CategoryChip({ category }: { category: Task["category"] }) {
  if (!category) return null;
  const bgHex = category.groupColor ?? category.color;
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.25 rounded-full text-xs font-medium text-muted-foreground shrink-0 max-w-[128px]"
      style={{ backgroundColor: bgHex ? `${bgHex}26` : "hsl(var(--muted))" }}
    >
      {category.color && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
      )}
      <span className="truncate">{category.name}</span>
    </span>
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
  const [isPressing, setIsPressing] = useState(false);
  const isCompleted = task.status === "COMPLETED";
  const isSkipped = task.status === "SKIPPED";
  const hasMemo = !!task.memo;

  const scheduledDateStatus = useMemo(() => getScheduledDateStatus(task.scheduledAt), [task.scheduledAt]);

  const timeEntries = useMemo(() => {
    const entries: Array<{ Icon: typeof PlusCircle; timestamp: string; className: string; bold: boolean }> = [];

    entries.push({
      Icon: PlusCircle,
      timestamp: task.createdAt,
      className: "text-muted-foreground/50",
      bold: matchReasons?.includes("この日に作成") ?? false,
    });

    // PENDING かつ編集済みの場合のみ更新日時を表示
    if (!isCompleted && !isSkipped && task.updatedAt !== task.createdAt) {
      entries.push({
        Icon: PenLine,
        timestamp: task.updatedAt,
        className: "text-muted-foreground/50",
        bold: false,
      });
    }

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
  }, [isCompleted, isSkipped, task.completedAt, task.skippedAt, task.createdAt, task.updatedAt, matchReasons]);

  const longPress = useLongPress({
    delay: 500,
    disabled: enableDragAndDrop,
    onLongPress: () => {
      setIsPressing(false);
      handlers.onOpenDetail(task);
    },
  });

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
      className="flex group relative cursor-pointer"
      onClick={() => {
        if (longPress.consumeFired()) return;
        handlers.onOpenDetail(task);
      }}
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

      {/* content-col: drag-handle を除く幅で flex-col */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-colors duration-150",
          isFlashing && "bg-success/10",
          isPressing && !enableDragAndDrop ? "bg-accent/60" : "hover:bg-accent/40",
        )}
        onPointerDown={() => {
          if (!enableDragAndDrop) {
            setIsPressing(true);
            longPress.onPointerDown();
          }
        }}
        onPointerUp={() => {
          setIsPressing(false);
          longPress.onPointerUp();
        }}
        onPointerLeave={() => {
          setIsPressing(false);
          longPress.onPointerLeave();
        }}
        onPointerCancel={() => {
          setIsPressing(false);
          longPress.onPointerCancel();
        }}
        onContextMenu={(e) => {
          if (!enableDragAndDrop) e.preventDefault();
        }}
      >
        <div className="px-3 py-2 space-y-1.5">
          {/* 上段: チェックボックス・タスク名・お気に入り */}
          <div className="flex items-center gap-2">
            <StopPropagation>
              <Checkbox
                checked={isCompleted}
                onCheckedChange={handleCheckChange}
                disabled={isSkipped || isFlashing}
                className="translate-y-[1px]"
              />
            </StopPropagation>
            <p className={cn("flex-1 text-sm font-medium leading-snug", (isCompleted || isSkipped) && "text-muted-foreground")}>
              {task.title}
            </p>
            {task.isFavorite && (
              <Star className="h-3.5 w-3.5 shrink-0 text-yellow-400" fill="currentColor" />
            )}
          </div>

          {/* メモ */}
          {hasMemo && (
            <div className="pl-6 text-xs text-muted-foreground whitespace-pre-wrap">
              <LinkText text={task.memo!} />
            </div>
          )}

          {/* カテゴリチップ・時刻 */}
          <div className="flex items-center justify-between gap-2 pl-6">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <CategoryChip category={task.category} />
              {showScheduledDate && task.scheduledAt && (
                <ScheduledDateChip scheduledAt={task.scheduledAt} status={scheduledDateStatus} />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {timeEntries.map((entry, i) => (
                <span key={i} className={cn("flex items-center gap-0.75 text-xs", entry.className, entry.bold && "font-bold")}>
                  <entry.Icon className="h-3 w-3 translate-y-[0.25px]" />
                  {formatCompactTime(entry.timestamp)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* やらない理由帯: content-col 幅いっぱい（drag-handle 除く） */}
        {isSkipped && task.skipReason && (
          <div className="px-3 py-1 bg-yellow-500/10 border-t border-yellow-500/20 text-xs text-yellow-700 dark:text-yellow-500">
            <span className="font-semibold mr-1">やらない理由</span>
            {task.skipReason}
          </div>
        )}
      </div>
    </div>
  );
}
