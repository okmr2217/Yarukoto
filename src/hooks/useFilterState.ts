"use client";

import { useAllTasks, useCategoryTaskCounts } from "@/hooks";
import { useFilterSearchParams, useDebouncedKeyword } from "@/hooks";
import type { StatusFilter } from "@/lib/filter-types";
import type { Category } from "@/types";
import { type CategoryFilter, UNGROUPED_VIRTUAL_ID } from "@/lib/category-filter";

export function useFilterState(categories: Category[], categoryFilter: CategoryFilter) {
  const { dateFilter, keyword, statusFilter, favoriteFilter, updateSearchParams, today } =
    useFilterSearchParams();

  const { localKeyword, isComposingRef, handleKeywordChange, handleCompositionEnd, handleKeywordClear } =
    useDebouncedKeyword(keyword, updateSearchParams);

  // カテゴリフィルターから categoryIds を解決
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

  // カテゴリ別・グループ別カウント用（カテゴリフィルター以外を適用した状態）
  const { data: categoryCounts } = useCategoryTaskCounts({
    date: dateFilter || undefined,
    keyword: keyword || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    isFavorite: favoriteFilter || undefined,
  });

  const countByCategory = categoryCounts?.byCategoryId ?? {};
  const countByGroup = categoryCounts?.byGroupId ?? {};

  // ステータス別カウント用（カテゴリフィルターを適用した状態）
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

  const hasActiveFilters = !!(dateFilter || keyword || statusFilter !== "pending" || favoriteFilter);

  const handleClearFilters = () => {
    handleKeywordClear();
    updateSearchParams({ status: null, favorite: null, date: null });
  };

  return {
    // search params
    dateFilter,
    keyword,
    statusFilter,
    favoriteFilter,
    today,
    updateSearchParams,
    // keyword input
    localKeyword,
    isComposingRef,
    handleKeywordChange,
    handleCompositionEnd,
    handleKeywordClear,
    // task data
    allFilteredTasks,
    countByCategory,
    countByGroup,
    statusCounts,
    // helpers
    hasActiveFilters,
    handleClearFilters,
  };
}
