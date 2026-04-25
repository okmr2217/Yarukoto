"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTodayInJST, addDaysJST } from "@/lib/dateUtils";
import { CategorySelector } from "./category-selector";
import { useRecentCategories } from "@/hooks/use-recent-categories";
import type { Category, Group } from "@/types";

export interface TaskInputData {
  title: string;
  scheduledAt?: string;
  categoryId?: string;
  memo?: string;
}

interface TaskInputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskInputData) => void;
  categories?: Category[];
  groups?: Group[];
  defaultDate?: string;
  defaultCategoryId?: string | null;
  isLoading?: boolean;
}

export function TaskInputModal({
  open,
  onOpenChange,
  onSubmit,
  categories = [],
  groups = [],
  defaultDate,
  defaultCategoryId,
  isLoading = false,
}: TaskInputModalProps) {
  const { getRecentIds } = useRecentCategories();

  const getInitialCategoryId = (): string | null => {
    if (defaultCategoryId && defaultCategoryId !== "none") {
      return defaultCategoryId;
    }
    return null;
  };

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultDate || "");
  const [categoryId, setCategoryId] = useState<string | null>(getInitialCategoryId());
  const [memo, setMemo] = useState("");
  const [recentIds] = useState(() => getRecentIds());

  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const memoInputRef = useRef<HTMLTextAreaElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // モーダルが開いたときにタイトル入力にフォーカス
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    onSubmit({
      title: title.trim(),
      scheduledAt: scheduledAt || undefined,
      categoryId: categoryId ?? undefined,
      memo: memo.trim() || undefined,
    });

    setTitle("");
    setMemo("");
    onOpenChange(false);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] p-0 gap-0 max-sm:top-4 max-sm:translate-y-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>タスクを追加</DialogTitle>
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
                ref={titleInputRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                    e.preventDefault();
                    if (window.matchMedia("(pointer: coarse)").matches) {
                      e.currentTarget.form?.requestSubmit();
                    } else {
                      memoInputRef.current?.focus();
                    }
                  }
                }}
                placeholder="新しいタスクを入力..."
                disabled={isLoading}
                rows={1}
                className="text-base resize-none overflow-hidden min-h-0"
              />
            </div>

            {/* メモ */}
            <div>
              <label className="text-sm font-medium block mb-1">メモ</label>
              <Textarea
                ref={memoInputRef}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="メモを入力..."
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
                mode="create"
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
                  variant={
                    scheduledAt === tomorrowString ? "default" : "outline"
                  }
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
          <div className="border-t p-4">
            <Button
              type="submit"
              className="w-full h-12"
              disabled={!title.trim() || isLoading}
            >
              追加
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
