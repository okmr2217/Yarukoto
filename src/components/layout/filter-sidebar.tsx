"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Star, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getTodayInJST, addDaysJST } from "@/lib/dateUtils";
import { useAllTasks, useGroups, useGroupExpanded } from "@/hooks";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";
import type { CategoryFilter } from "@/lib/category-filter";
import { FilterSectionInfo } from "./filter-section-info";

type StatusFilter = "all" | "pending" | "completed" | "skipped";
export type ViewMode = "list" | "schedule";
export type ListSortOrder = "displayOrder" | "createdAt";
export type ScheduledSortOrder = "scheduledAt_asc" | "scheduledAt_desc" | "createdAt";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "未完了" },
  { value: "completed", label: "完了" },
  { value: "skipped", label: "やらない" },
];

const LIST_SORT_OPTIONS: { value: ListSortOrder; label: string }[] = [
  { value: "displayOrder", label: "表示順" },
  { value: "createdAt", label: "作成日時" },
];

const SCHEDULED_SORT_OPTIONS: { value: ScheduledSortOrder; label: string }[] = [
  { value: "scheduledAt_asc", label: "予定日（近い順）" },
  { value: "scheduledAt_desc", label: "予定日（遠い順）" },
  { value: "createdAt", label: "作成日時" },
];

const KEYWORD_DEBOUNCE_MS = 300;
const UNGROUPED_VIRTUAL_ID = "__ungrouped__";

interface FilterSidebarProps {
  categories: Category[];
  categoriesLoading: boolean;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  listSort: ListSortOrder;
  onListSortChange: (sort: ListSortOrder) => void;
  scheduledSort: ScheduledSortOrder;
  onScheduledSortChange: (sort: ScheduledSortOrder) => void;
}

interface AccordionSectionProps {
  title: string;
  isActive: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  tooltip?: string;
}

function AccordionSection({ title, isActive, open, onToggle, children, tooltip }: AccordionSectionProps) {
  return (
    <div className="shrink-0 border-t border-border">
      <div
        role="button"
        tabIndex={0}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        onClick={onToggle}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
      >
        <span className="flex items-center gap-1.5">
          {title}
          {tooltip && <FilterSectionInfo content={tooltip} />}
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
        </span>
        <ChevronDown className={cn("size-3.5 transition-transform duration-150", open && "rotate-180")} />
      </div>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export function FilterSidebar({
  categories,
  categoriesLoading,
  categoryFilter,
  onCategoryFilterChange,
  viewMode,
  onViewModeChange,
  listSort,
  onListSortChange,
  scheduledSort,
  onScheduledSortChange,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getTodayInJST();

  const [keywordOpen, setKeywordOpen] = useState(false);
  const [favoriteOpen, setFavoriteOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const dateFilter = searchParams.get("date") || "";
  const keyword = searchParams.get("keyword") || "";
  const statusFilter = (searchParams.get("status") || "pending") as StatusFilter;
  const favoriteFilter = searchParams.get("favorite") === "true";

  const [localKeyword, setLocalKeyword] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  const isComposingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword);
    setLocalKeyword(keyword);
  }

  const { data: groups = [] } = useGroups();
  const { isExpanded, toggle } = useGroupExpanded();

  const { data: tasksForCategoryCounts } = useAllTasks({
    date: dateFilter || undefined,
    keyword: keyword || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    isFavorite: favoriteFilter || undefined,
  });

  const countByCategory = (() => {
    if (!tasksForCategoryCounts) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    for (const task of tasksForCategoryCounts) {
      const key = task.categoryId ?? "none";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  })();

  const taskCategoryIds = (() => {
    if (categoryFilter.type === "all") return undefined;
    if (categoryFilter.type === "group") {
      return categories.filter((c) => c.groupId === categoryFilter.groupId).map((c) => c.id);
    }
    return [categoryFilter.categoryId];
  })();

  const { data: allFilteredTasks } = useAllTasks({
    categoryIds: taskCategoryIds,
    date: dateFilter || undefined,
    keyword: keyword || undefined,
    isFavorite: favoriteFilter || undefined,
  });

  const statusCounts: Record<StatusFilter, number> = (() => {
    if (!allFilteredTasks) return { all: 0, pending: 0, completed: 0, skipped: 0 };
    const pending = allFilteredTasks.filter((t) => t.status === "PENDING").length;
    const completed = allFilteredTasks.filter((t) => t.status === "COMPLETED").length;
    const skipped = allFilteredTasks.filter((t) => t.status === "SKIPPED").length;
    return { all: allFilteredTasks.length, pending, completed, skipped };
  })();

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  const commitKeyword = (value: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      updateSearchParams({ keyword: value || null });
    }, KEYWORD_DEBOUNCE_MS);
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalKeyword(value);
    if (!isComposingRef.current) commitKeyword(value);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    commitKeyword(e.currentTarget.value);
  };

  const handleKeywordClear = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setLocalKeyword("");
    updateSearchParams({ keyword: null });
  };

  const groupedCategories = (() => {
    const byGroup: Record<string, Category[]> = {};
    const ungrouped: Category[] = [];
    for (const cat of categories) {
      if (cat.groupId) {
        byGroup[cat.groupId] = [...(byGroup[cat.groupId] ?? []), cat];
      } else {
        ungrouped.push(cat);
      }
    }
    return { byGroup, ungrouped };
  })();

  const hasGroups = groups.length > 0 && categories.some((c) => c.groupId);

  return (
    <aside className="hidden md:flex flex-col w-75 border-r shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-hidden">
      {/* Status — always visible */}
      <section className="shrink-0 px-4 py-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground tracking-wide mb-1">
          ステータス
          <FilterSectionInfo content="タスクの進捗状態で絞り込みます。1つだけ選択できます。デフォルトは「未完了」で、完了済みやスキップしたタスクの確認にも使えます。" />
        </span>
        <div className="flex rounded-md border border-input overflow-hidden divide-x divide-border text-xs bg-background">
          {STATUS_OPTIONS.map((option) => {
            const count = statusCounts[option.value];
            const active = statusFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-1 px-0.5 min-h-8 transition-colors",
                  active ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted",
                )}
                onClick={() => updateSearchParams({ status: option.value === "pending" ? null : option.value })}
              >
                <span className="whitespace-nowrap leading-none">{option.label}</span>
                {allFilteredTasks !== undefined && (
                  <span className={cn("tabular-nums leading-none mt-0.5 text-[10px]", active ? "opacity-70" : "opacity-50")}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* View — always visible */}
      <section className="shrink-0 border-t border-border px-4 py-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground tracking-wide mb-1">
          ビュー
          <FilterSectionInfo content="表示形式を切り替えます。「一覧」は日付セクション別のリスト表示、「予定」は予定日が設定されたタスクを日付順に表示します。" />
        </span>
        <div className="flex rounded-md border border-input overflow-hidden divide-x divide-border text-xs bg-background">
          <button
            type="button"
            className={cn(
              "flex-1 flex items-center justify-center py-1.5 transition-colors",
              viewMode === "list" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted",
            )}
            onClick={() => onViewModeChange("list")}
          >
            一覧
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 flex items-center justify-center py-1.5 transition-colors",
              viewMode === "schedule" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted",
            )}
            onClick={() => onViewModeChange("schedule")}
          >
            予定
          </button>
        </div>
      </section>

      {/* Date — always visible */}
      <section className="shrink-0 border-t border-border px-4 py-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground tracking-wide mb-1">
          日付
          <FilterSectionInfo content="特定の日付のタスクだけを表示します。未設定の場合は全期間が対象。前後の矢印ボタンで1日ずつ移動できます。" />
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => updateSearchParams({ date: addDaysJST(dateFilter || today, -1) })}
            className="shrink-0 h-8 w-7 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="前日"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => updateSearchParams({ date: e.target.value || null })}
            className="h-8 text-xs flex-1 min-w-0"
          />
          <button
            type="button"
            onClick={() => updateSearchParams({ date: addDaysJST(dateFilter || today, 1) })}
            className="shrink-0 h-8 w-7 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="翌日"
          >
            <ChevronRight className="size-3.5" />
          </button>
          <button
            type="button"
            className={cn(
              "shrink-0 h-8 px-2 text-xs rounded-md border border-input bg-background transition-colors",
              dateFilter === today ? "text-muted-foreground/40 cursor-default" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            onClick={() => updateSearchParams({ date: today })}
            disabled={dateFilter === today}
          >
            今日
          </button>
          {dateFilter && (
            <button
              type="button"
              onClick={() => updateSearchParams({ date: null })}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="日付フィルタを解除"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* Category section — fills remaining height with internal scroll */}
      <div className="flex flex-col flex-1 min-h-0 border-t border-border px-4 py-2">
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground tracking-wide">
            カテゴリ
            <FilterSectionInfo content="1つ選択できます。グループ名をクリックするとそのグループ全体、カテゴリ名をクリックすると個別絞り込みができます。再クリックで解除。" />
          </span>
          {categoryFilter.type !== "all" && (
            <button
              type="button"
              onClick={() => onCategoryFilterChange({ type: "all" })}
              className="text-[11px] px-1.5 py-0.5 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              選択解除
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {categoriesLoading ? (
            <div className="space-y-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-6 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div>
              {groups.map((group) => {
                const groupCats = groupedCategories.byGroup[group.id] ?? [];
                if (groupCats.length === 0) return null;
                const isGroupSelected = categoryFilter.type === "group" && categoryFilter.groupId === group.id;
                const expanded = isExpanded(group.id);
                const groupColor = group.color;

                return (
                  <div key={group.id} className="mb-0.5">
                    <div
                      className="flex items-center w-full rounded-md text-[11px] overflow-hidden"
                      style={
                        isGroupSelected && groupColor
                          ? { backgroundColor: `${groupColor}26`, borderLeft: `3px solid ${groupColor}`, paddingLeft: "calc(0.375rem - 3px)" }
                          : {}
                      }
                    >
                      <button
                        type="button"
                        onClick={() => onCategoryFilterChange(isGroupSelected ? { type: "all" } : { type: "group", groupId: group.id })}
                        className={cn(
                          "flex items-center gap-1.5 flex-1 py-[3px] transition-colors min-w-0",
                          isGroupSelected ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/40",
                          !isGroupSelected && "px-1.5",
                        )}
                      >
                        {groupColor && (
                          <span
                            className={cn("w-1.5 h-1.5 rounded-full shrink-0", !isGroupSelected && "opacity-40")}
                            style={{ backgroundColor: groupColor }}
                          />
                        )}
                        {group.emoji && <span className="shrink-0 text-sm leading-none">{group.emoji}</span>}
                        <span className="truncate">{group.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggle(group.id)}
                        className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mr-0.5"
                        aria-label={expanded ? "折りたたむ" : "展開する"}
                      >
                        <ChevronDown className={cn("size-2.5 transition-transform duration-150", expanded && "rotate-180")} />
                      </button>
                    </div>

                    {expanded && (
                      <div className="ml-3">
                        {groupCats.map((cat) => {
                          const count = countByCategory[cat.id] ?? 0;
                          const isCatSelected = categoryFilter.type === "category" && categoryFilter.categoryId === cat.id;
                          const catColor = cat.color;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => onCategoryFilterChange(isCatSelected ? { type: "all" } : { type: "category", categoryId: cat.id })}
                              aria-pressed={isCatSelected}
                              className={cn(
                                "flex items-center gap-1.5 w-full py-[3px] rounded-md text-[11px] transition-colors min-w-0 text-left",
                                isCatSelected ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/40",
                                !isCatSelected && "px-1.5",
                              )}
                              style={
                                isCatSelected && catColor
                                  ? { backgroundColor: `${catColor}20`, borderLeft: `3px solid ${catColor}`, paddingLeft: "calc(6px - 3px)" }
                                  : {}
                              }
                            >
                              <span
                                className={cn("w-1.5 h-1.5 rounded-full shrink-0", !isCatSelected && "opacity-40")}
                                style={catColor ? { backgroundColor: catColor } : {}}
                              />
                              <span className="truncate flex-1">{cat.name}</span>
                              {count > 0 && <span className="text-[10px] tabular-nums shrink-0 opacity-70">{count}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {groupedCategories.ungrouped.length > 0 && hasGroups && (
                <div className="mb-0.5">
                  <div className="flex items-center w-full rounded-md text-[11px]">
                    <span className="flex items-center gap-1.5 flex-1 px-1.5 py-[3px] text-muted-foreground">
                      <span>📂</span>
                      <span>グループなし</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle(UNGROUPED_VIRTUAL_ID)}
                      className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mr-0.5"
                      aria-label={isExpanded(UNGROUPED_VIRTUAL_ID) ? "折りたたむ" : "展開する"}
                    >
                      <ChevronDown className={cn("size-2.5 transition-transform duration-150", isExpanded(UNGROUPED_VIRTUAL_ID) && "rotate-180")} />
                    </button>
                  </div>
                  {isExpanded(UNGROUPED_VIRTUAL_ID) && (
                    <div className="ml-3">
                      {groupedCategories.ungrouped.map((cat) => {
                        const count = countByCategory[cat.id] ?? 0;
                        const isCatSelected = categoryFilter.type === "category" && categoryFilter.categoryId === cat.id;
                        const catColor = cat.color;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => onCategoryFilterChange(isCatSelected ? { type: "all" } : { type: "category", categoryId: cat.id })}
                            aria-pressed={isCatSelected}
                            className={cn(
                              "flex items-center gap-1.5 w-full py-[3px] rounded-md text-[11px] transition-colors min-w-0 text-left",
                              isCatSelected ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/40",
                              !isCatSelected && "px-1.5",
                            )}
                            style={
                              isCatSelected && catColor
                                ? { backgroundColor: `${catColor}20`, borderLeft: `3px solid ${catColor}`, paddingLeft: "calc(6px - 3px)" }
                                : {}
                            }
                          >
                            <span
                              className={cn("w-1.5 h-1.5 rounded-full shrink-0", !isCatSelected && "opacity-40")}
                              style={catColor ? { backgroundColor: catColor } : {}}
                            />
                            <span className="truncate flex-1">{cat.name}</span>
                            {count > 0 && <span className="text-[10px] tabular-nums shrink-0 opacity-70">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {groupedCategories.ungrouped.length > 0 && !hasGroups && (
                <div className="mt-0.5">
                  {groupedCategories.ungrouped.map((cat) => {
                    const count = countByCategory[cat.id] ?? 0;
                    const isCatSelected = categoryFilter.type === "category" && categoryFilter.categoryId === cat.id;
                    const catColor = cat.color;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onCategoryFilterChange(isCatSelected ? { type: "all" } : { type: "category", categoryId: cat.id })}
                        aria-pressed={isCatSelected}
                        className={cn(
                          "flex items-center gap-1.5 w-full py-[3px] rounded-md text-[11px] transition-colors min-w-0 text-left",
                          isCatSelected ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/40",
                          !isCatSelected && "px-1.5",
                        )}
                        style={
                          isCatSelected && catColor
                            ? { backgroundColor: `${catColor}20`, borderLeft: `3px solid ${catColor}`, paddingLeft: "calc(6px - 3px)" }
                            : {}
                        }
                      >
                        <span
                          className={cn("w-1.5 h-1.5 rounded-full shrink-0", !isCatSelected && "opacity-40")}
                          style={catColor ? { backgroundColor: catColor } : {}}
                        />
                        <span className="truncate flex-1">{cat.name}</span>
                        {count > 0 && <span className="text-[10px] tabular-nums shrink-0 opacity-70">{count}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {(groups.length > 0 || groupedCategories.ungrouped.length > 0) && <div className="my-1 border-t border-border" />}

              {(() => {
                const count = countByCategory["none"] ?? 0;
                const isCatSelected = categoryFilter.type === "category" && categoryFilter.categoryId === "none";
                return (
                  <button
                    type="button"
                    onClick={() => onCategoryFilterChange(isCatSelected ? { type: "all" } : { type: "category", categoryId: "none" })}
                    aria-pressed={isCatSelected}
                    className={cn(
                      "w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-xs font-semibold transition-colors min-w-0",
                      !isCatSelected ? "text-muted-foreground hover:text-foreground hover:bg-accent" : "text-foreground",
                    )}
                    style={isCatSelected ? { borderLeft: "3px solid currentColor", paddingLeft: "calc(0.375rem - 3px)" } : {}}
                  >
                    {isCatSelected ? (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-foreground" />
                    ) : (
                      <span className="shrink-0 w-2 h-2 rounded-full border border-foreground/30" />
                    )}
                    <span className="truncate">カテゴリなし</span>
                    {count > 0 && <span className="ml-auto shrink-0 text-[10px] tabular-nums opacity-50">{count}</span>}
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Keyword — accordion */}
      <AccordionSection title="キーワード" isActive={!!keyword} open={keywordOpen} onToggle={() => setKeywordOpen(!keywordOpen)} tooltip="タスク名・メモに含まれる文字列でリアルタイムに絞り込みます。他のフィルターと組み合わせて使えます。">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="キーワード..."
            value={localKeyword}
            onChange={handleKeywordChange}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={handleCompositionEnd}
            className="pl-8 pr-7 h-8 text-xs focus-visible:ring-1"
          />
          {localKeyword && (
            <button
              type="button"
              onClick={handleKeywordClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </AccordionSection>

      {/* Favorite — accordion */}
      <AccordionSection title="お気に入り" isActive={favoriteFilter} open={favoriteOpen} onToggle={() => setFavoriteOpen(!favoriteOpen)} tooltip="★マークをつけたタスクだけを表示します。重要なタスクをすばやく確認したいときに使います。">
        <button
          type="button"
          onClick={() => updateSearchParams({ favorite: favoriteFilter ? null : "true" })}
          className={cn(
            "w-full flex items-center gap-2 px-2.5 h-8 rounded-md border text-xs transition-colors",
            favoriteFilter
              ? "bg-yellow-50 border-yellow-300 text-yellow-700 font-medium dark:bg-yellow-950/30 dark:border-yellow-700 dark:text-yellow-400"
              : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Star
            className={cn("size-3.5 shrink-0", favoriteFilter ? "text-yellow-500" : "text-muted-foreground/40")}
            fill={favoriteFilter ? "currentColor" : "none"}
          />
          お気に入りのみ
          {allFilteredTasks !== undefined && (
            <span className={cn("ml-auto tabular-nums text-xs", favoriteFilter ? "opacity-70" : "opacity-50")}>
              {allFilteredTasks.filter((t) => t.isFavorite).length}
            </span>
          )}
        </button>
      </AccordionSection>

      {/* Sort — accordion */}
      <AccordionSection
        title="並び替え"
        isActive={viewMode === "list" ? listSort !== "displayOrder" : scheduledSort !== "scheduledAt_asc"}
        open={sortOpen}
        onToggle={() => setSortOpen(!sortOpen)}
        tooltip="タスクの並び順を変更します。「表示順」はドラッグ＆ドロップで設定したカスタム順、「作成日時」は新しい順に並びます。"
      >
        <div className="grid grid-cols-2 gap-1">
          {viewMode === "list"
            ? LIST_SORT_OPTIONS.map((option) => {
                const active = listSort === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "flex items-center justify-center px-2 py-1.5 rounded-md text-xs transition-colors border",
                      active ? "bg-primary text-primary-foreground font-medium border-primary" : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    onClick={() => onListSortChange(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })
            : SCHEDULED_SORT_OPTIONS.map((option) => {
                const active = scheduledSort === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "flex items-center justify-center px-2 py-1.5 rounded-md text-xs transition-colors border",
                      active ? "bg-primary text-primary-foreground font-medium border-primary" : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    onClick={() => onScheduledSortChange(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
        </div>
      </AccordionSection>
    </aside>
  );
}
