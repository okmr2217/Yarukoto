"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategorySelector } from "./category-selector";
import { useRecentCategories } from "@/hooks/use-recent-categories";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import type { Task, Category, Group } from "@/types";

export interface TaskEditData {
  id: string;
  title: string;
  scheduledAt?: string | null;
  categoryId?: string | null;
  memo?: string | null;
}

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TaskEditData) => void;
  onToggleFavorite?: (id: string) => void;
  task: Task | null;
  categories: Category[];
  groups?: Group[];
}

export function TaskEditDialog({
  open,
  onOpenChange,
  onSave,
  onToggleFavorite,
  task,
  categories,
  groups = [],
}: TaskEditDialogProps) {
  const { getRecentIds } = useRecentCategories();

  const [title, setTitle] = useState(task?.title ?? "");
  const [scheduledAt, setScheduledAt] = useState(task?.scheduledAt ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(task?.categoryId ?? null);
  const [memo, setMemo] = useState(task?.memo ?? "");
  const [isFavorite, setIsFavorite] = useState(task?.isFavorite ?? false);
  const [error, setError] = useState<string | null>(null);
  const [recentIds] = useState(() => getRecentIds());
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const memoTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = titleTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    requestAnimationFrame(() => {
      el.focus();
      el.select();
    });
  }, [open]);

  const handleFavoriteToggle = () => {
    if (!task) return;
    setIsFavorite((prev) => !prev);
    onToggleFavorite?.(task.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("タスク名を入力してください");
      return;
    }

    if (!task) return;

    onSave({
      id: task.id,
      title: trimmedTitle,
      scheduledAt: scheduledAt || null,
      categoryId: categoryId,
      memo: memo.trim() || null,
    });
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] p-0 gap-0 max-sm:top-4 max-sm:translate-y-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>タスクを編集</DialogTitle>
            <button
              type="button"
              onClick={handleFavoriteToggle}
              className={cn(
                "p-1.5 rounded transition-colors hover:bg-accent",
                isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500",
              )}
              aria-label={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
            >
              <Star className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.requestSubmit();
            }
          }}
          className="flex flex-col"
        >
          <div className="overflow-y-auto p-4 space-y-5">
            {/* タスク名 */}
            <div>
              <Label htmlFor="edit-task-title" className="block mb-1">タスク名</Label>
              <Textarea
                ref={titleTextareaRef}
                id="edit-task-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError(null);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                    e.preventDefault();
                    if (window.matchMedia("(pointer: coarse)").matches) {
                      e.currentTarget.form?.requestSubmit();
                    } else {
                      memoTextareaRef.current?.focus();
                    }
                  }
                }}
                placeholder="タスクの内容"
                rows={1}
                className="text-base resize-none overflow-hidden min-h-0"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            {/* メモ */}
            <div>
              <Label htmlFor="edit-task-memo" className="block mb-1">メモ</Label>
              <Textarea
                ref={memoTextareaRef}
                id="edit-task-memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="タスクの詳細やメモ"
                rows={3}
                className="resize-none overflow-y-auto max-h-32"
              />
            </div>

            {/* カテゴリ */}
            <div>
              <Label className="block mb-1">カテゴリ</Label>
              <CategorySelector
                categories={categories}
                groups={groups}
                selectedCategoryId={categoryId}
                onChange={setCategoryId}
                mode="edit"
                recentCategoryIds={recentIds}
              />
            </div>

            {/* 予定日 */}
            <div>
              <Label htmlFor="edit-task-date" className="block mb-1">予定日</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-task-date"
                  type="date"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="flex-1"
                />
                {scheduledAt && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScheduledAt("")}
                  >
                    クリア
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="border-t p-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">保存する</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
