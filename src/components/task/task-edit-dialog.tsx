"use client";

import { useState, useRef, useEffect } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { TaskFormFields } from "./task-form-fields";
import { useRecentCategories } from "@/hooks";
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
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>タスクを編集</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.requestSubmit();
            }
          }}
          className="flex flex-col flex-1 min-h-0"
        >
          <ResponsiveDialogBody>
            <TaskFormFields
              title={title}
              onTitleChange={(val) => { setTitle(val); setError(null); }}
              memo={memo}
              onMemoChange={setMemo}
              scheduledAt={scheduledAt}
              onScheduledAtChange={setScheduledAt}
              categoryId={categoryId}
              onCategoryIdChange={setCategoryId}
              categories={categories}
              groups={groups}
              recentCategoryIds={recentIds}
              mode="edit"
              titleError={error}
              titleRef={titleTextareaRef}
              memoRef={memoTextareaRef}
            />
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">保存する</Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
