"use client";

import { X } from "lucide-react";
import { useAllTasks } from "@/hooks";
import { useFilterSearchParams } from "@/hooks/use-filter-search-params";
import { useDebouncedKeyword } from "@/hooks/use-debounced-keyword";
import { FilterSectionInfo } from "./filter-section-info";
import { FilterStatusChips, FilterViewModeToggle, FilterDateNav, FilterFavoriteToggle, FilterSortChips, FilterKeywordInput } from "./filter-controls";
import type { StatusFilter, ViewMode, ListSortOrder, ScheduledSortOrder } from "@/lib/filter-types";

export type FilterValues = {
  keyword: string;
  status: StatusFilter;
  isFavorite: boolean;
  date: string;
};

function SectionLabel({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/60 tracking-wider mb-0.5">
      {children}
      {tooltip && <FilterSectionInfo content={tooltip} />}
    </span>
  );
}

interface FilterBottomSheetProps {
  open: boolean;
  onClose: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  listSort: ListSortOrder;
  onListSortChange: (sort: ListSortOrder) => void;
  scheduledSort: ScheduledSortOrder;
  onScheduledSortChange: (sort: ScheduledSortOrder) => void;
}

export function FilterBottomSheet({ open, onClose, viewMode, onViewModeChange, listSort, onListSortChange, scheduledSort, onScheduledSortChange }: FilterBottomSheetProps) {
  const { dateFilter, keyword, statusFilter, favoriteFilter, updateSearchParams, today } = useFilterSearchParams();

  const hasActiveFilters = !!(dateFilter || keyword || statusFilter !== "pending" || favoriteFilter);

  const { localKeyword, isComposingRef, handleKeywordChange, handleCompositionEnd, handleKeywordClear } = useDebouncedKeyword(keyword, updateSearchParams);

  const { data: allFilteredTasks } = useAllTasks({
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

  const handleClearFilters = () => {
    handleKeywordClear();
    updateSearchParams({ status: null, favorite: null, date: null });
  };

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
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold">絞り込み</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
              >
                <X className="size-3" />
                クリア
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* キーワード */}
            <section>
              <SectionLabel tooltip="タスク名・メモに含まれる文字列でリアルタイムに絞り込みます。他のフィルターと組み合わせて使えます。">キーワード</SectionLabel>
              <FilterKeywordInput
                localKeyword={localKeyword}
                isComposingRef={isComposingRef}
                onKeywordChange={handleKeywordChange}
                onCompositionEnd={handleCompositionEnd}
                onKeywordClear={handleKeywordClear}
              />
            </section>

            {/* ステータス */}
            <section>
              <SectionLabel tooltip="タスクの進捗状態で絞り込みます。1つだけ選択できます。デフォルトは「未完了」で、完了済みやスキップしたタスクの確認にも使えます。">ステータス</SectionLabel>
              <FilterStatusChips
                statusFilter={statusFilter}
                statusCounts={statusCounts}
                allFilteredTasks={allFilteredTasks}
                onUpdate={updateSearchParams}
              />
            </section>

            {/* ビュー */}
            <section>
              <SectionLabel tooltip="表示形式を切り替えます。「一覧」は日付セクション別のリスト表示、「予定」は予定日が設定されたタスクを日付順に表示します。">ビュー</SectionLabel>
              <FilterViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
            </section>

            {/* 日付 */}
            <section>
              <SectionLabel tooltip="特定の日付のタスクだけを表示します。未設定の場合は全期間が対象。前後の矢印ボタンで1日ずつ移動できます。">日付</SectionLabel>
              <FilterDateNav dateFilter={dateFilter} today={today} onUpdate={updateSearchParams} />
            </section>

            {/* お気に入り */}
            <section>
              <SectionLabel tooltip="★マークをつけたタスクだけを表示します。重要なタスクをすばやく確認したいときに使います。">お気に入り</SectionLabel>
              <FilterFavoriteToggle
                favoriteFilter={favoriteFilter}
                favoriteCount={allFilteredTasks?.filter((t) => t.isFavorite).length}
                onUpdate={updateSearchParams}
              />
            </section>

            {/* 並び順 */}
            <section>
              <SectionLabel tooltip="タスクの並び順を変更します。「表示順」はドラッグ＆ドロップで設定したカスタム順、「作成日時」は新しい順に並びます。">並び順</SectionLabel>
              <FilterSortChips
                viewMode={viewMode}
                listSort={listSort}
                scheduledSort={scheduledSort}
                onListSortChange={onListSortChange}
                onScheduledSortChange={onScheduledSortChange}
              />
            </section>
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
