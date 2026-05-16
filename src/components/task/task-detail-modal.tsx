"use client";

import { Star, CheckCircle2, Ban, Clock, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkText } from "@/components/ui/link-text";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import type { Task, Category } from "@/types";
import { formatCompactTime, formatRelativeScheduledDate } from "@/lib/dateUtils";

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onUncomplete: (id: string) => void;
  onSkip: (id: string) => void;
  onUnskip: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  categories?: Category[];
}

function formatDetailScheduledDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const absolute = `${y}/${m}/${d}`;
  const relative = formatRelativeScheduledDate(dateStr);
  if (/^\d+\/\d+$/.test(relative)) return absolute;
  return `${absolute}（${relative}）`;
}

export function TaskDetailModal({ task, open, onClose, onEdit, onUncomplete, onSkip, onUnskip, onDelete, onToggleFavorite, categories }: TaskDetailModalProps) {
  if (!task) return null;

  const isCompleted = task.status === "COMPLETED";
  const isSkipped = task.status === "SKIPPED";
  const fullCategory = categories?.find((c) => c.id === task.categoryId);

  return (
    <ResponsiveDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <div className="flex items-start gap-3 pr-6">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: task.category?.color ? `${task.category.color}28` : "hsl(var(--muted))" }}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: task.category?.color ?? "hsl(var(--muted-foreground) / 0.3)" }}
              />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <ResponsiveDialogTitle
                  className={cn(
                    "flex-1 text-[15px] font-medium leading-snug",
                    isCompleted && "text-muted-foreground line-through",
                    isSkipped && "text-muted-foreground/60",
                  )}
                >
                  {task.title}
                </ResponsiveDialogTitle>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(task.id)}
                  className={cn(
                    "p-1 rounded transition-colors shrink-0",
                    task.isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-label={task.isFavorite ? "お気に入りを解除" : "お気に入りにする"}
                >
                  <Star className="h-4 w-4" fill={task.isFavorite ? "currentColor" : "none"} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {task.category
                  ? [fullCategory?.group?.name, task.category.name].filter(Boolean).join(" › ")
                  : task.scheduledAt
                    ? formatDetailScheduledDate(task.scheduledAt)
                    : null}
              </p>
            </div>
          </div>
          <ResponsiveDialogDescription className="sr-only">タスクの詳細情報を表示します。</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="flex-1 overflow-y-auto space-y-3">
          {/* Scheduled date (when category is also shown) */}
          {task.scheduledAt && task.category && (
            <p className="text-xs text-muted-foreground">{formatDetailScheduledDate(task.scheduledAt)}</p>
          )}

          {/* Status */}
          {isCompleted && task.completedAt && (
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="text-[13px]">完了 — {formatCompactTime(task.completedAt)}</span>
            </div>
          )}
          {isSkipped && task.skippedAt && (
            <div className="flex items-center gap-1.5 text-yellow-600">
              <Ban className="h-4 w-4 shrink-0" />
              <span className="text-[13px]">やらない — {formatCompactTime(task.skippedAt)}</span>
            </div>
          )}

          {/* Skip reason */}
          {isSkipped && task.skipReason && (
            <div className="rounded-xl p-3 bg-muted">
              <p className="text-xs text-muted-foreground mb-0.5">やらない理由</p>
              <p className="text-sm">{task.skipReason}</p>
            </div>
          )}

          {/* Memo */}
          {task.memo && (
            <div className="rounded-xl p-3 bg-muted">
              <p className="text-xs text-muted-foreground mb-1">メモ</p>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                <LinkText text={task.memo} />
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex gap-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              作成 {formatCompactTime(task.createdAt)}
            </span>
            {task.updatedAt !== task.createdAt && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Pencil className="h-3 w-3" />
                更新 {formatCompactTime(task.updatedAt)}
              </span>
            )}
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <div className="flex gap-2 w-full">
            {!isCompleted && !isSkipped && (
              <button
                type="button"
                onClick={() => onSkip(task.id)}
                className="h-10 px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors shrink-0"
              >
                <Ban size={14} />
                やらない
              </button>
            )}
            {isCompleted && (
              <button
                type="button"
                onClick={() => onUncomplete(task.id)}
                className="h-10 px-3 rounded-xl flex items-center justify-center text-sm font-medium border border-border hover:bg-muted transition-colors shrink-0"
              >
                完了を取り消す
              </button>
            )}
            {isSkipped && (
              <button
                type="button"
                onClick={() => onUnskip(task.id)}
                className="h-10 px-3 rounded-xl flex items-center justify-center text-sm font-medium border border-border hover:bg-muted transition-colors shrink-0"
              >
                取り消す
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="h-10 px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              <Pencil size={14} />
              編集
            </button>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
