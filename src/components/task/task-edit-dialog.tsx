"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CategorySelector } from "./category-selector";
import { useRecentCategories } from "@/hooks/use-recent-categories";
import { getTodayInJST, addDaysJST } from "@/lib/dateUtils";
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
  task: Task | null;
  categories: Category[];
  groups?: Group[];
}

export function TaskEditDialog({
  open,
  onOpenChange,
  onSave,
  task,
  categories,
  groups = [],
}: TaskEditDialogProps) {
  const { getRecentIds } = useRecentCategories();

  const [title, setTitle] = useState(task?.title ?? "");
  const [scheduledAt, setScheduledAt] = useState(task?.scheduledAt ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(task?.categoryId ?? null);
  const [memo, setMemo] = useState(task?.memo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [recentIds] = useState(() => getRecentIds());
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const memoTextareaRef = useRef<HTMLTextAreaElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

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

  const todayString = getTodayInJST();
  const tomorrowString = addDaysJST(todayString, 1);

  const handleDateSelect = (type: "none" | "today" | "tomorrow" | "custom") => {
    if (type === "none") {
      setScheduledAt("");
    } else if (type === "today") {
      setScheduledAt(todayString);
    } else if (type === "tomorrow") {
      setScheduledAt(tomorrowString);
    } else if (type === "custom") {
      dateInputRef.current?.showPicker();
    }
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
          <DialogTitle>タスクを編集</DialogTitle>
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
              <label className="text-sm font-medium block mb-1">タスク名</label>
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
              <label className="text-sm font-medium block mb-1">メモ</label>
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
              <label className="text-sm font-medium block mb-1">カテゴリ</label>
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
              <label className="text-sm font-medium block mb-1">予定日</label>
              <div className="grid grid-cols-4 gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={!scheduledAt ? "default" : "outline"}
                  onClick={() => handleDateSelect("none")}
                >
                  なし
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={scheduledAt === todayString ? "default" : "outline"}
                  onClick={() => handleDateSelect("today")}
                >
                  今日
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={scheduledAt === tomorrowString ? "default" : "outline"}
                  onClick={() => handleDateSelect("tomorrow")}
                >
                  明日
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDateSelect("custom")}
                >
                  <Calendar className="size-4" />
                  選択
                </Button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="sr-only"
                />
              </div>
              {scheduledAt && (
                <p className="text-xs text-muted-foreground">
                  選択中: {scheduledAt.replace(/-/g, "/")}
                </p>
              )}
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
