"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Tag } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategorySelector } from "./category-selector";
import { useRecentCategories } from "@/hooks";
import type { Category, Group } from "@/types";
import { cn } from "@/lib/utils";
import { getTodayInJST, addDaysJST, formatRelativeScheduledDate } from "@/lib/dateUtils";

export interface TaskCreateData {
  title: string;
  scheduledAt?: string;
  categoryId?: string;
  memo?: string;
}

interface TaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskCreateData) => void;
  categories?: Category[];
  groups?: Group[];
  defaultDate?: string;
  defaultCategoryId?: string | null;
  isLoading?: boolean;
}

const MEMO_MAX_H = 144; // ~6 rows

function resizeMemo(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, MEMO_MAX_H)}px`;
  el.style.overflowY = el.scrollHeight > MEMO_MAX_H ? "auto" : "hidden";
}

export function TaskCreateModal({
  open,
  onOpenChange,
  onSubmit,
  categories = [],
  groups = [],
  defaultDate,
  defaultCategoryId,
  isLoading = false,
}: TaskCreateModalProps) {
  const { getRecentIds } = useRecentCategories();

  const getInitialCategoryId = (): string | null => {
    if (defaultCategoryId && defaultCategoryId !== "none") return defaultCategoryId;
    return null;
  };

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultDate || "");
  const [categoryId, setCategoryId] = useState<string | null>(getInitialCategoryId());
  const [memo, setMemo] = useState("");
  const [categorySubOpen, setCategorySubOpen] = useState(false);
  const [dateSubOpen, setDateSubOpen] = useState(false);
  const [recentIds] = useState(() => getRecentIds());

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const memoRef = useRef<HTMLTextAreaElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        titleRef.current?.focus();
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
  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const categoryBgHex = selectedCategory?.group?.color ?? selectedCategory?.color;

  return (
    <>
      <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>タスクを追加</ResponsiveDialogTitle>
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
            <ResponsiveDialogBody className="space-y-4">
              {/* タスク名 */}
              <div className="space-y-1.5">
                <Label>タスク名</Label>
                <Textarea
                  ref={titleRef}
                  value={title}
                  onChange={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                    setTitle(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                      e.preventDefault();
                      if (window.matchMedia("(pointer: coarse)").matches) {
                        e.currentTarget.form?.requestSubmit();
                      } else {
                        memoRef.current?.focus();
                      }
                    }
                  }}
                  rows={1}
                  placeholder="新しいタスクを入力..."
                  disabled={isLoading}
                  className="text-base resize-none overflow-hidden min-h-0"
                />
              </div>

              {/* メモ */}
              <div className="space-y-1.5">
                <Label>メモ</Label>
                <Textarea
                  ref={memoRef}
                  value={memo}
                  onChange={(e) => {
                    resizeMemo(e.target);
                    setMemo(e.target.value);
                  }}
                  rows={1}
                  placeholder="メモを入力..."
                  disabled={isLoading}
                  className="resize-none overflow-hidden"
                />
              </div>

              {/* Chips: カテゴリ・予定日 */}
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setCategorySubOpen(true)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors disabled:pointer-events-none disabled:opacity-40",
                    selectedCategory
                      ? "border-transparent hover:opacity-80"
                      : "border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                  )}
                  style={
                    selectedCategory
                      ? { backgroundColor: categoryBgHex ? `${categoryBgHex}26` : "hsl(var(--muted))" }
                      : undefined
                  }
                >
                  {selectedCategory ? (
                    <>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedCategory.color ?? "#6B7280" }} />
                      {selectedCategory.name}
                    </>
                  ) : (
                    <>
                      <Tag className="h-3 w-3" />
                      カテゴリなし
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setDateSubOpen(true)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors disabled:pointer-events-none disabled:opacity-40",
                    scheduledAt
                      ? "bg-muted border-transparent text-foreground hover:bg-muted/70"
                      : "border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {scheduledAt ? formatRelativeScheduledDate(scheduledAt) : "予定日なし"}
                </button>
              </div>
            </ResponsiveDialogBody>

            <ResponsiveDialogFooter>
              <Button type="submit" className="w-full sm:w-auto h-12 sm:h-9" disabled={!title.trim() || isLoading}>
                追加
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* カテゴリ選択サブモーダル */}
      <Dialog open={categorySubOpen} onOpenChange={setCategorySubOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>カテゴリ</DialogTitle>
            <DialogDescription className="sr-only">カテゴリを選択してください。</DialogDescription>
          </DialogHeader>
          <CategorySelector
            categories={categories}
            groups={groups}
            selectedCategoryId={categoryId}
            onChange={(id) => {
              setCategoryId(id);
              setCategorySubOpen(false);
            }}
            mode="create"
            recentCategoryIds={recentIds}
          />
        </DialogContent>
      </Dialog>

      {/* 予定日選択サブモーダル */}
      <Dialog open={dateSubOpen} onOpenChange={setDateSubOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>予定日</DialogTitle>
            <DialogDescription className="sr-only">予定日を選択してください。</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-1.5 pt-2">
            <Button
              type="button"
              size="sm"
              variant={!scheduledAt ? "default" : "outline"}
              onClick={() => { setScheduledAt(""); setDateSubOpen(false); }}
            >
              なし
            </Button>
            <Button
              type="button"
              size="sm"
              variant={scheduledAt === todayString ? "default" : "outline"}
              onClick={() => { setScheduledAt(todayString); setDateSubOpen(false); }}
            >
              今日
            </Button>
            <Button
              type="button"
              size="sm"
              variant={scheduledAt === tomorrowString ? "default" : "outline"}
              onClick={() => { setScheduledAt(tomorrowString); setDateSubOpen(false); }}
            >
              明日
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => dateInputRef.current?.showPicker()}
            >
              <Calendar className="size-4" />
              選択
            </Button>
            <input
              ref={dateInputRef}
              type="date"
              value={scheduledAt}
              onChange={(e) => { setScheduledAt(e.target.value); if (e.target.value) setDateSubOpen(false); }}
              className="sr-only"
            />
          </div>
          {scheduledAt && (
            <p className="text-xs text-muted-foreground mt-2">{scheduledAt.replace(/-/g, "/")}</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
