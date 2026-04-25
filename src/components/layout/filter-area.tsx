"use client";

import type { Category } from "@/types";
import { CategoryFilter } from "./category-filter";

interface FilterAreaProps {
  categories: Category[];
  categoriesLoading: boolean;
}

export function FilterArea({ categories, categoriesLoading }: FilterAreaProps) {
  return (
    <div>
      <CategoryFilter categories={categories} isLoading={categoriesLoading} />
    </div>
  );
}
