"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAllTasks } from "@/hooks";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";
import { type CategoryFilter, UNGROUPED_VIRTUAL_ID } from "@/lib/category-filter";
import { FilterSectionInfo } from "./filter-section-info";
import { FilterStatusChips, FilterViewModeToggle, FilterDateNav, FilterFavoriteToggle, FilterSortChips, FilterKeywordInput } from "./filter-controls";
import { FilterCategoryTree } from "./filter-category-tree";
import { useFilterSearchParams } from "@/hooks/use-filter-search-params";
import { useDebouncedKeyword } from "@/hooks/use-debounced-keyword";
import {
  type StatusFilter,
  type ViewMode,
  type ListSortOrder,
  type ScheduledSortOrder,
} from "@/lib/filter-types";

export type { ViewMode, ListSortOrder, ScheduledSortOrder };

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
  const { dateFilter, keyword, statusFilter, favoriteFilter, updateSearchParams, today } = useFilterSearchParams();
  const { localKeyword, isComposingRef, handleKeywordChange, handleCompositionEnd, handleKeywordClear } = useDebouncedKeyword(keyword, updateSearchParams);

  const [keywordOpen, setKeywordOpen] = useState(false);
  const [favoriteOpen, setFavoriteOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const taskCategoryIds = (() => {
    if (categoryFilter.type === "all") return undefined;
    if (categoryFilter.type === "group") {
      if (categoryFilter.groupId === UNGROUPED_VIRTUAL_ID) {
        return categories.filter((c) => !c.groupId).map((c) => c.id);
      }
      return categories.filter((c) => c.groupId === categoryFilter.groupId).map((c) => c.id);
    }
    return [categoryFilter.categoryId];
  })();

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

  return (
    <aside className="hidden md:flex flex-col w-75 border-r shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-hidden">
      {/* Status — always visible */}
      <section className="shrink-0 px-4 py-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground tracking-wide mb-1">
          ステータス
          <FilterSectionInfo content="タスクの進捗状態で絞り込みます。1つだけ選択できます。デフォルトは「未完了」で、完了済みやスキップしたタスクの確認にも使えます。" />
        </span>
        <FilterStatusChips statusFilter={statusFilter} statusCounts={statusCounts} allFilteredTasks={allFilteredTasks} onUpdate={updateSearchParams} />
      </section>

      {/* View — always visible */}
      <section className="shrink-0 border-t border-border px-4 py-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground tracking-wide mb-1">
          ビュー
          <FilterSectionInfo content="表示形式を切り替えます。「一覧」は日付セクション別のリスト表示、「予定」は予定日が設定されたタスクを日付順に表示します。" />
        </span>
        <FilterViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </section>

      {/* Date — always visible */}
      <section className="shrink-0 border-t border-border px-4 py-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground tracking-wide mb-1">
          日付
          <FilterSectionInfo content="特定の日付のタスクだけを表示します。未設定の場合は全期間が対象。前後の矢印ボタンで1日ずつ移動できます。" />
        </span>
        <FilterDateNav dateFilter={dateFilter} today={today} onUpdate={updateSearchParams} />
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
          <FilterCategoryTree
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={onCategoryFilterChange}
            countByCategory={countByCategory}
          />
        </div>
      </div>

      {/* Keyword — accordion */}
      <AccordionSection title="キーワード" isActive={!!keyword} open={keywordOpen} onToggle={() => setKeywordOpen(!keywordOpen)} tooltip="タスク名・メモに含まれる文字列でリアルタイムに絞り込みます。他のフィルターと組み合わせて使えます。">
        <FilterKeywordInput
          localKeyword={localKeyword}
          isComposingRef={isComposingRef}
          onKeywordChange={handleKeywordChange}
          onCompositionEnd={handleCompositionEnd}
          onKeywordClear={handleKeywordClear}
        />
      </AccordionSection>

      {/* Favorite — accordion */}
      <AccordionSection title="お気に入り" isActive={favoriteFilter} open={favoriteOpen} onToggle={() => setFavoriteOpen(!favoriteOpen)} tooltip="★マークをつけたタスクだけを表示します。重要なタスクをすばやく確認したいときに使います。">
        <FilterFavoriteToggle
          favoriteFilter={favoriteFilter}
          favoriteCount={allFilteredTasks?.filter((t) => t.isFavorite).length}
          onUpdate={updateSearchParams}
        />
      </AccordionSection>

      {/* Sort — accordion */}
      <AccordionSection
        title="並び替え"
        isActive={viewMode === "list" ? listSort !== "displayOrder" : scheduledSort !== "scheduledAt_asc"}
        open={sortOpen}
        onToggle={() => setSortOpen(!sortOpen)}
        tooltip="タスクの並び順を変更します。「表示順」はドラッグ＆ドロップで設定したカスタム順、「作成日時」は新しい順に並びます。"
      >
        <FilterSortChips
          viewMode={viewMode}
          listSort={listSort}
          scheduledSort={scheduledSort}
          onListSortChange={onListSortChange}
          onScheduledSortChange={onScheduledSortChange}
        />
      </AccordionSection>
    </aside>
  );
}
