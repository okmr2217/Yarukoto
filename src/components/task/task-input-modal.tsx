"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TaskFormFields } from "./task-form-fields";
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
    if (defaultCategoryId && defaultCategoryId !== "none") return defaultCategoryId;
    return null;
  };

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultDate || "");
  const [categoryId, setCategoryId] = useState<string | null>(getInitialCategoryId());
  const [memo, setMemo] = useState("");
  const [recentIds] = useState(() => getRecentIds());

  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const memoInputRef = useRef<HTMLTextAreaElement>(null);

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
          <TaskFormFields
            title={title}
            onTitleChange={setTitle}
            memo={memo}
            onMemoChange={setMemo}
            scheduledAt={scheduledAt}
            onScheduledAtChange={setScheduledAt}
            categoryId={categoryId}
            onCategoryIdChange={setCategoryId}
            categories={categories}
            groups={groups}
            recentCategoryIds={recentIds}
            mode="create"
            isLoading={isLoading}
            titleRef={titleInputRef}
            memoRef={memoInputRef}
          />

          <div className="border-t p-4">
            <Button type="submit" className="w-full h-12" disabled={!title.trim() || isLoading}>
              追加
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
