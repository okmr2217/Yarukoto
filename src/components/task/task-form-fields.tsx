"use client";

import { useRef } from "react";
import { Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getTodayInJST, addDaysJST } from "@/lib/dateUtils";
import { CategorySelector } from "./category-selector";
import type { Category, Group } from "@/types";

interface TaskFormFieldsProps {
  title: string;
  onTitleChange: (value: string) => void;
  memo: string;
  onMemoChange: (value: string) => void;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  categoryId: string | null;
  onCategoryIdChange: (id: string | null) => void;
  categories: Category[];
  groups: Group[];
  recentCategoryIds: string[];
  mode: "create" | "edit";
  isLoading?: boolean;
  titleError?: string | null;
  titleRef: React.RefObject<HTMLTextAreaElement | null>;
  memoRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function TaskFormFields({
  title,
  onTitleChange,
  memo,
  onMemoChange,
  scheduledAt,
  onScheduledAtChange,
  categoryId,
  onCategoryIdChange,
  categories,
  groups,
  recentCategoryIds,
  mode,
  isLoading = false,
  titleError,
  titleRef,
  memoRef,
}: TaskFormFieldsProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const todayString = getTodayInJST();
  const tomorrowString = addDaysJST(todayString, 1);

  const handleDateSelect = (type: "none" | "today" | "tomorrow" | "custom") => {
    if (type === "none") {
      onScheduledAtChange("");
    } else if (type === "today") {
      onScheduledAtChange(todayString);
    } else if (type === "tomorrow") {
      onScheduledAtChange(tomorrowString);
    } else {
      dateInputRef.current?.showPicker();
    }
  };

  return (
    <div className="overflow-y-auto p-4 space-y-5">
      {/* タスク名 */}
      <div>
        <label className="text-sm font-medium block mb-1">タスク名</label>
        <Textarea
          ref={titleRef}
          value={title}
          onChange={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
            onTitleChange(e.target.value);
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
          placeholder={mode === "create" ? "新しいタスクを入力..." : "タスクの内容"}
          disabled={isLoading}
          rows={1}
          className="text-base resize-none overflow-hidden min-h-0"
        />
        {titleError && <p className="text-sm text-destructive">{titleError}</p>}
      </div>

      {/* メモ */}
      <div>
        <label className="text-sm font-medium block mb-1">メモ</label>
        <Textarea
          ref={memoRef}
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder={mode === "create" ? "メモを入力..." : "タスクの詳細やメモ"}
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
          onChange={onCategoryIdChange}
          mode={mode}
          recentCategoryIds={recentCategoryIds}
        />
      </div>

      {/* 予定日 */}
      <div>
        <label className="text-sm font-medium block mb-1">予定日</label>
        <div className="grid grid-cols-4 gap-1.5">
          <Button type="button" size="sm" variant={!scheduledAt ? "default" : "outline"} onClick={() => handleDateSelect("none")}>
            なし
          </Button>
          <Button type="button" size="sm" variant={scheduledAt === todayString ? "default" : "outline"} onClick={() => handleDateSelect("today")}>
            今日
          </Button>
          <Button type="button" size="sm" variant={scheduledAt === tomorrowString ? "default" : "outline"} onClick={() => handleDateSelect("tomorrow")}>
            明日
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => handleDateSelect("custom")}>
            <Calendar className="size-4" />
            選択
          </Button>
          <input
            ref={dateInputRef}
            type="date"
            value={scheduledAt}
            onChange={(e) => onScheduledAtChange(e.target.value)}
            className="sr-only"
          />
        </div>
        {scheduledAt && (
          <p className="text-xs text-muted-foreground">選択中: {scheduledAt.replace(/-/g, "/")}</p>
        )}
      </div>
    </div>
  );
}
