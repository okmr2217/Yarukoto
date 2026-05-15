"use client";

import { FilterSectionInfo } from "./filter-section-info";
import {
  FilterStatusChips,
  FilterViewModeToggle,
  FilterDateNav,
  FilterFavoriteToggle,
  FilterSortChips,
  FilterKeywordInput,
} from "./filter-controls";
import { FilterCategoryTree } from "./filter-category-tree";
import type { useFilterState } from "@/hooks/useFilterState";
import type { Category } from "@/types";
import type { ViewMode, ListSortOrder, ScheduledSortOrder } from "@/lib/filter-types";
import type { CategoryFilter } from "@/lib/category-filter";

type FilterState = ReturnType<typeof useFilterState>;

// ─── セクションラベル ────────────────────────────────────────────────────────

interface SectionLabelProps {
  children: React.ReactNode;
  tooltip?: string;
}

export function SectionLabel({ children, tooltip }: SectionLabelProps) {
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground tracking-wide mb-1">
      {children}
      {tooltip && <FilterSectionInfo content={tooltip} />}
    </span>
  );
}

// ─── 各セクション ─────────────────────────────────────────────────────────────

export function StatusSection({ state }: { state: FilterState }) {
  return (
    <section>
      <SectionLabel tooltip="タスクの進捗状態で絞り込みます。1つだけ選択できます。デフォルトは「未完了」で、完了済みやスキップしたタスクの確認にも使えます。">
        ステータス
      </SectionLabel>
      <FilterStatusChips
        statusFilter={state.statusFilter}
        statusCounts={state.statusCounts}
        allFilteredTasks={state.allFilteredTasks}
        onUpdate={state.updateSearchParams}
      />
    </section>
  );
}

export function ViewSection({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  return (
    <section>
      <SectionLabel tooltip="表示形式を切り替えます。「一覧」は日付セクション別のリスト表示、「予定」は予定日が設定されたタスクを日付順に表示します。">
        ビュー
      </SectionLabel>
      <FilterViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
    </section>
  );
}

export function DateSection({ state }: { state: FilterState }) {
  return (
    <section>
      <SectionLabel tooltip="特定の日付のタスクだけを表示します。未設定の場合は全期間が対象。前後の矢印ボタンで1日ずつ移動できます。">
        日付
      </SectionLabel>
      <FilterDateNav
        dateFilter={state.dateFilter}
        today={state.today}
        onUpdate={state.updateSearchParams}
      />
    </section>
  );
}

export function CategorySection({
  categories,
  categoriesLoading,
  categoryFilter,
  onCategoryFilterChange,
  countByCategory,
}: {
  categories: Category[];
  categoriesLoading: boolean;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  countByCategory: Record<string, number>;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-1">
        <SectionLabel tooltip="1つ選択できます。グループ名をクリックするとそのグループ全体、カテゴリ名をクリックすると個別絞り込みができます。再クリックで解除。">
          カテゴリ
        </SectionLabel>
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
      <FilterCategoryTree
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={onCategoryFilterChange}
        countByCategory={countByCategory}
      />
    </section>
  );
}

export function KeywordSection({ state }: { state: FilterState }) {
  return (
    <section>
      <SectionLabel tooltip="タスク名・メモに含まれる文字列でリアルタイムに絞り込みます。他のフィルターと組み合わせて使えます。">
        キーワード
      </SectionLabel>
      <FilterKeywordInput
        localKeyword={state.localKeyword}
        isComposingRef={state.isComposingRef}
        onKeywordChange={state.handleKeywordChange}
        onCompositionEnd={state.handleCompositionEnd}
        onKeywordClear={state.handleKeywordClear}
      />
    </section>
  );
}

export function FavoriteSection({ state }: { state: FilterState }) {
  return (
    <section>
      <SectionLabel tooltip="★マークをつけたタスクだけを表示します。重要なタスクをすばやく確認したいときに使います。">
        お気に入り
      </SectionLabel>
      <FilterFavoriteToggle
        favoriteFilter={state.favoriteFilter}
        favoriteCount={state.allFilteredTasks?.filter((t) => t.isFavorite).length}
        onUpdate={state.updateSearchParams}
      />
    </section>
  );
}

export function SortSection({
  state,
  viewMode,
  listSort,
  onListSortChange,
  scheduledSort,
  onScheduledSortChange,
}: {
  state: FilterState;
  viewMode: ViewMode;
  listSort: ListSortOrder;
  onListSortChange: (sort: ListSortOrder) => void;
  scheduledSort: ScheduledSortOrder;
  onScheduledSortChange: (sort: ScheduledSortOrder) => void;
}) {
  return (
    <section>
      <SectionLabel tooltip="タスクの並び順を変更します。「表示順」はドラッグ＆ドロップで設定したカスタム順、「作成日時」は新しい順に並びます。">
        並び順
      </SectionLabel>
      <FilterSortChips
        viewMode={viewMode}
        listSort={listSort}
        scheduledSort={scheduledSort}
        onListSortChange={onListSortChange}
        onScheduledSortChange={onScheduledSortChange}
      />
    </section>
  );
}
