"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Star, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getTodayInJST, addDaysJST } from "@/lib/dateUtils";
import { useAllTasks, useGroups, getGroupSelectionState, useGroupExpanded } from "@/hooks";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";
import { CATEGORY_DESELECTED_SENTINEL } from "@/lib/constants";
import { CategoryGroupAccordion } from "./category-group-accordion";

type StatusFilter = "all" | "pending" | "completed" | "skipped";
type SortOrder = "displayOrder" | "createdAt" | "completedAt" | "skippedAt";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "未完了" },
  { value: "completed", label: "完了" },
  { value: "skipped", label: "やらない" },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "displayOrder", label: "表示順" },
  { value: "createdAt", label: "作成日時" },
  { value: "completedAt", label: "完了日時" },
  { value: "skippedAt", label: "やらない日時" },
];

const KEYWORD_DEBOUNCE_MS = 300;
const UNGROUPED_VIRTUAL_ID = "__ungrouped__";

interface FilterSidebarProps {
  categories: Category[];
  categoriesLoading: boolean;
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
}

interface AccordionSectionProps {
  title: string;
  isActive: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, isActive, open, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="shrink-0 border-t border-border">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        onClick={onToggle}
      >
        <span className="flex items-center gap-1.5">
          {title}
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
        </span>
        <ChevronDown className={cn("size-3.5 transition-transform duration-150", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export function FilterSidebar({ categories, categoriesLoading, selectedCategoryIds, onToggleCategory }: FilterSidebarProps) {
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
  const sortOrder = (searchParams.get("sort") || "displayOrder") as SortOrder;
  const categoryParam = searchParams.get("category");
  const isDefaultAllSelected = categoryParam === null;
  const isAllDeselected = categoryParam === CATEGORY_DESELECTED_SENTINEL;

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

  const { data: allFilteredTasks } = useAllTasks(
    {
      categoryIds: isDefaultAllSelected ? undefined : selectedCategoryIds,
      date: dateFilter || undefined,
      keyword: keyword || undefined,
      isFavorite: favoriteFilter || undefined,
    },
    { enabled: !isAllDeselected },
  );

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

  const allSelected = !categoriesLoading && isDefaultAllSelected;
  const noneSelected = isAllDeselected;

  const handleSelectAll = () => updateSearchParams({ category: null });
  const handleDeselectAll = () => updateSearchParams({ category: CATEGORY_DESELECTED_SENTINEL });

  const handleToggleGroup = (groupId: string, shiftKey: boolean) => {
    const groupCategories =
      groupId === UNGROUPED_VIRTUAL_ID ? categories.filter((c) => !c.groupId) : categories.filter((c) => c.groupId === groupId);
    const groupIds = groupCategories.map((c) => c.id);
    const state = getGroupSelectionState(groupIds, selectedCategoryIds);

    if (shiftKey) {
      if (groupIds.length === 0) return;
      updateSearchParams({ category: groupIds.join(",") });
      return;
    }

    if (state === "all") {
      const next = selectedCategoryIds.filter((id) => !groupIds.includes(id));
      if (next.length === 0) {
        updateSearchParams({ category: CATEGORY_DESELECTED_SENTINEL });
      } else {
        const allIds = [...categories.map((c) => c.id), "none"];
        const isAllSelected = allIds.length === next.length && allIds.every((id) => next.includes(id));
        updateSearchParams({ category: isAllSelected ? null : next.join(",") });
      }
    } else {
      const next = [...new Set([...selectedCategoryIds, ...groupIds])];
      const allIds = [...categories.map((c) => c.id), "none"];
      const isAllSelected = allIds.length === next.length && allIds.every((id) => next.includes(id));
      updateSearchParams({ category: isAllSelected ? null : next.join(",") });
    }
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
        <span className="block text-xs font-semibold text-muted-foreground tracking-wide mb-1">ステータス</span>
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

      {/* Date — always visible */}
      <section className="shrink-0 border-t border-border px-4 py-2">
        <span className="block text-xs font-semibold text-muted-foreground tracking-wide mb-1">日付</span>
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
          <span className="text-xs font-semibold text-muted-foreground tracking-wide">カテゴリ</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDeselectAll}
              className={cn(
                "text-[11px] px-1.5 py-0.5 rounded transition-colors",
                noneSelected ? "text-foreground font-semibold bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              全て解除
            </button>
            <button
              type="button"
              onClick={handleSelectAll}
              className={cn(
                "text-[11px] px-1.5 py-0.5 rounded transition-colors",
                allSelected ? "text-foreground font-semibold bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              全て選択
            </button>
          </div>
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
                const groupIds = groupCats.map((c) => c.id);
                const selectionState = getGroupSelectionState(groupIds, selectedCategoryIds);
                return (
                  <CategoryGroupAccordion
                    key={group.id}
                    groupId={group.id}
                    groupName={group.name}
                    groupEmoji={group.emoji}
                    groupColor={group.color}
                    categories={groupCats}
                    selectedCategoryIds={selectedCategoryIds}
                    countByCategory={countByCategory}
                    isCollapsed={!isExpanded(group.id)}
                    onToggleCollapse={toggle}
                    onToggleGroup={handleToggleGroup}
                    onToggleCategory={onToggleCategory}
                    selectionState={selectionState}
                  />
                );
              })}

              {groupedCategories.ungrouped.length > 0 &&
                (hasGroups ? (
                  <CategoryGroupAccordion
                    groupId={UNGROUPED_VIRTUAL_ID}
                    groupName="グループなし"
                    groupEmoji="📂"
                    groupColor={null}
                    categories={groupedCategories.ungrouped}
                    selectedCategoryIds={selectedCategoryIds}
                    countByCategory={countByCategory}
                    isCollapsed={!isExpanded(UNGROUPED_VIRTUAL_ID)}
                    onToggleCollapse={toggle}
                    onToggleGroup={handleToggleGroup}
                    onToggleCategory={onToggleCategory}
                    selectionState={getGroupSelectionState(
                      groupedCategories.ungrouped.map((c) => c.id),
                      selectedCategoryIds,
                    )}
                  />
                ) : (
                  <div className="mt-0.5">
                    {groupedCategories.ungrouped.map((category) => {
                      const count = countByCategory[category.id] ?? 0;
                      const active = selectedCategoryIds.includes(category.id);
                      const color = category.color;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => onToggleCategory(category.id)}
                          aria-pressed={active}
                          className={cn(
                            "flex items-center gap-1.5 w-full px-2 py-[3px] rounded-md text-[11px] transition-colors min-w-0",
                            active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-accent/40",
                          )}
                        >
                          <span
                            className={cn("w-1.5 h-1.5 rounded-full shrink-0", !active && "opacity-40")}
                            style={color ? { backgroundColor: color } : {}}
                          />
                          <span className="truncate flex-1">{category.name}</span>
                          {count > 0 && <span className="text-[10px] tabular-nums shrink-0 opacity-70">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}

              {(groups.length > 0 || groupedCategories.ungrouped.length > 0) && <div className="my-1 border-t border-border" />}

              {(() => {
                const count = countByCategory["none"] ?? 0;
                const active = selectedCategoryIds.includes("none");
                return (
                  <button
                    type="button"
                    onClick={() => onToggleCategory("none")}
                    aria-pressed={active}
                    className={cn(
                      "w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-xs font-semibold transition-colors min-w-0",
                      !active ? "text-muted-foreground hover:text-foreground hover:bg-accent" : "text-foreground",
                    )}
                  >
                    {active ? (
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
      <AccordionSection title="キーワード" isActive={!!keyword} open={keywordOpen} onToggle={() => setKeywordOpen(!keywordOpen)}>
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
      <AccordionSection title="お気に入り" isActive={favoriteFilter} open={favoriteOpen} onToggle={() => setFavoriteOpen(!favoriteOpen)}>
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
        isActive={sortOrder !== "displayOrder"}
        open={sortOpen}
        onToggle={() => setSortOpen(!sortOpen)}
      >
        <div className="grid grid-cols-2 gap-1">
          {SORT_OPTIONS.map((option) => {
            const active = sortOrder === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex items-center justify-center px-2 py-1.5 rounded-md text-xs transition-colors border",
                  active ? "bg-primary text-primary-foreground font-medium border-primary" : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                onClick={() => updateSearchParams({ sort: option.value === "displayOrder" ? null : option.value })}
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
