"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useTaskMutations } from "@/hooks/use-task-mutations";
import { useCategories } from "@/hooks/use-categories";
import { getTodayInJST, addDaysJST, parseJSTDate, formatDateToJST } from "@/lib/dateUtils";
import type { Task } from "@/types";
import { Star, Calendar as CalendarIcon, Tag, Loader2, Check, ChevronDown, Ban, Trash2 } from "lucide-react";

type SaveState = "idle" | "typing" | "saving" | "saved";
type OpenPicker = "category" | "date" | null;

interface TaskDetailContentProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailContent({ task, onClose }: TaskDetailContentProps) {
  const [localTitle, setLocalTitle] = useState(task.title);
  const [localMemo, setLocalMemo] = useState(task.memo ?? "");
  const [localCategoryId, setLocalCategoryId] = useState<string | null>(task.categoryId);
  const [localScheduledAt, setLocalScheduledAt] = useState<string | null>(task.scheduledAt);
  const [localIsFavorite, setLocalIsFavorite] = useState(task.isFavorite);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const mutations = useTaskMutations();
  const { data: categories = [] } = useCategories();

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTitleRef = useRef(localTitle);
  const latestMemoRef = useRef(localMemo);
  const latestCategoryIdRef = useRef(localCategoryId);
  const latestScheduledAtRef = useRef(localScheduledAt);

  useEffect(() => { latestTitleRef.current = localTitle; }, [localTitle]);
  useEffect(() => { latestMemoRef.current = localMemo; }, [localMemo]);
  useEffect(() => { latestCategoryIdRef.current = localCategoryId; }, [localCategoryId]);
  useEffect(() => { latestScheduledAtRef.current = localScheduledAt; }, [localScheduledAt]);

  const doSave = useCallback(async () => {
    setSaveState("saving");
    try {
      await mutations.updateTask.mutateAsync({
        id: task.id,
        title: latestTitleRef.current || task.title,
        memo: latestMemoRef.current || null,
        categoryId: latestCategoryIdRef.current,
        scheduledAt: latestScheduledAtRef.current,
      });
      setSaveState("saved");
      savedTimerRef.current = setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("idle");
    }
  }, [task.id, task.title, mutations.updateTask]);

  const scheduleSave = useCallback(() => {
    setSaveState("typing");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      doSave();
    }, 800);
  }, [doSave]);

  const flushAndClose = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
    if (saveState === "typing") {
      await doSave();
    }
    onClose();
  }, [saveState, doSave, onClose]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalTitle(e.target.value);
    scheduleSave();
  };

  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalMemo(e.target.value);
    scheduleSave();
  };

  const handleToggleFavorite = () => {
    const next = !localIsFavorite;
    setLocalIsFavorite(next);
    mutations.toggleFavorite.mutate(task.id);
  };

  const handleCategorySelect = (id: string | null) => {
    setLocalCategoryId(id);
    latestCategoryIdRef.current = id;
    setOpenPicker(null);
    scheduleSave();
  };

  const handleDateSelect = (dateStr: string | null) => {
    setLocalScheduledAt(dateStr);
    latestScheduledAtRef.current = dateStr;
    setOpenPicker(null);
    scheduleSave();
  };

  const handleSkipToggle = () => {
    if (task.status === "SKIPPED") {
      mutations.unskipTask.mutate(task.id);
    } else {
      mutations.skipTask.mutate({ id: task.id });
    }
    onClose();
  };

  const handleDelete = () => {
    mutations.deleteTask.mutate(task.id);
    setDeleteDialogOpen(false);
    onClose();
  };

  const selectedCategory = categories.find((c) => c.id === localCategoryId) ?? null;
  const today = getTodayInJST();
  const tomorrow = addDaysJST(today, 1);
  const calendarSelected = localScheduledAt ? parseJSTDate(localScheduledAt) : undefined;

  const isSkipped = task.status === "SKIPPED";

  return (
    <div className="flex flex-col gap-4 px-1">
      {/* SaveIndicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleToggleFavorite}
          className={cn(
            "flex items-center gap-1.5 text-sm px-2 py-1 rounded-md transition-colors",
            localIsFavorite
              ? "text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20"
              : "text-muted-foreground hover:bg-accent",
          )}
          aria-label={localIsFavorite ? "お気に入りを解除" : "お気に入りに追加"}
        >
          <Star className="h-4 w-4" fill={localIsFavorite ? "currentColor" : "none"} />
          <span>{localIsFavorite ? "お気に入り" : "お気に入りに追加"}</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground h-6">
          {saveState === "typing" && <span>入力中…</span>}
          {saveState === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>保存中</span>
            </>
          )}
          {saveState === "saved" && (
            <>
              <Check className="h-3 w-3 text-success" />
              <span>保存済み</span>
            </>
          )}
        </div>
      </div>

      {/* TitleTextarea */}
      <textarea
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[60px]"
        value={localTitle}
        onChange={handleTitleChange}
        placeholder="タスク名"
        rows={2}
      />

      {/* MemoTextarea */}
      <textarea
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]"
        value={localMemo}
        onChange={handleMemoChange}
        placeholder="メモ（任意）"
        rows={3}
      />

      {/* MetaRow: CategoryBadge + DateChip */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* CategoryBadge */}
        <div className="relative">
          <button
            onClick={() => setOpenPicker(openPicker === "category" ? null : "category")}
            className={cn(
              "flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full border transition-colors",
              openPicker === "category"
                ? "border-ring ring-2 ring-ring/50 bg-accent"
                : "border-border hover:bg-accent",
            )}
          >
            {selectedCategory ? (
              <>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedCategory.color ?? undefined }}
                />
                <span>{selectedCategory.name}</span>
              </>
            ) : (
              <>
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">カテゴリ</span>
              </>
            )}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {openPicker === "category" && (
            <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-md border border-border bg-popover shadow-md p-2">
              <div className="grid grid-cols-2 gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md text-left transition-colors hover:bg-accent",
                      localCategoryId === cat.id && "bg-accent font-medium",
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color ?? undefined }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md text-left transition-colors hover:bg-accent col-span-2",
                    localCategoryId === null && "bg-accent font-medium",
                  )}
                >
                  <span className="w-2 h-2 rounded-full shrink-0 border border-border" />
                  <span className="text-muted-foreground">カテゴリなし</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DateChip */}
        <div className="relative">
          <button
            onClick={() => setOpenPicker(openPicker === "date" ? null : "date")}
            className={cn(
              "flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full border transition-colors",
              openPicker === "date"
                ? "border-ring ring-2 ring-ring/50 bg-accent"
                : "border-border hover:bg-accent",
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={localScheduledAt ? "text-foreground" : "text-muted-foreground"}>
              {localScheduledAt
                ? localScheduledAt === today
                  ? "今日"
                  : localScheduledAt === tomorrow
                    ? "明日"
                    : localScheduledAt
                : "予定日"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {openPicker === "date" && (
            <div className="absolute top-full left-0 mt-1 z-50 rounded-md border border-border bg-popover shadow-md p-3">
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => handleDateSelect(null)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    localScheduledAt === null ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent",
                  )}
                >
                  なし
                </button>
                <button
                  onClick={() => handleDateSelect(today)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    localScheduledAt === today ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent",
                  )}
                >
                  今日
                </button>
                <button
                  onClick={() => handleDateSelect(tomorrow)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    localScheduledAt === tomorrow ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent",
                  )}
                >
                  明日
                </button>
              </div>
              <Calendar
                mode="single"
                selected={calendarSelected}
                onSelect={(date) => {
                  if (date) {
                    handleDateSelect(formatDateToJST(date));
                  } else {
                    handleDateSelect(null);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ActionRow */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={handleSkipToggle}
          className={cn(
            "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors",
            isSkipped
              ? "text-foreground hover:bg-accent"
              : "text-yellow-600 hover:bg-yellow-500/10",
          )}
        >
          <Ban className="h-4 w-4" />
          {isSkipped ? "やらないを取り消す" : "やらない"}
        </button>

        <button
          onClick={() => setDeleteDialogOpen(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          削除
        </button>
      </div>

      {/* 閉じるボタン */}
      <button
        onClick={flushAndClose}
        className="w-full text-sm py-2 rounded-md border border-border hover:bg-accent transition-colors"
      >
        閉じる
      </button>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>タスクを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>この操作は元に戻せません。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
