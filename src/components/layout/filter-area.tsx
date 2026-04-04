"use client";

import type { Category } from "@/types";
import { CategoryFilter } from "./category-filter";

interface FilterAreaProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  categoriesLoading: boolean;
}

export function FilterArea({ categories, selectedCategoryIds, onToggleCategory, onSelectAll, onDeselectAll, categoriesLoading }: FilterAreaProps) {
  return (
    <div className="sticky top-0 z-10">
      <CategoryFilter
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        onToggleCategory={onToggleCategory}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        isLoading={categoriesLoading}
      />
    </div>
  );
}
