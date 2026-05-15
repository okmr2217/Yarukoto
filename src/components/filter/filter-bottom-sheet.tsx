"use client";

import { X } from "lucide-react";
import type { Category } from "@/types";
import type { CategoryFilter } from "@/lib/category-filter";
import type { ViewMode, ListSortOrder, ScheduledSortOrder } from "@/lib/filter-types";
import { useFilterState } from "@/hooks/useFilterState";
import {
  StatusSection,
  ViewSection,
  DateSection,
  CategorySection,
  KeywordSection,
  FavoriteSection,
  SortSection,
} from "./filter-sections";

interface FilterBottomSheetProps {
  open: boolean;
  onClose: () => void;
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

export function FilterBottomSheet({
  open,
  onClose,
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
}: FilterBottomSheetProps) {
  const state = useFilterState(categories, categoryFilter);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-4 pb-2">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold">絞り込み</span>
            {state.hasActiveFilters && (
              <button
                type="button"
                onClick={state.handleClearFilters}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
              >
                <X className="size-3" />
                クリア
              </button>
            )}
          </div>

          {/* セクション群 */}
          <div className="flex flex-col gap-4">
            <KeywordSection state={state} />
            <StatusSection state={state} />
            <ViewSection viewMode={viewMode} onViewModeChange={onViewModeChange} />
            <DateSection state={state} />
            <CategorySection
              categories={categories}
              categoriesLoading={categoriesLoading}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={onCategoryFilterChange}
              countByCategory={state.countByCategory}
            />
            <FavoriteSection state={state} />
            <SortSection
              state={state}
              viewMode={viewMode}
              listSort={listSort}
              onListSortChange={onListSortChange}
              scheduledSort={scheduledSort}
              onScheduledSortChange={onScheduledSortChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border mt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </>
  );
}
