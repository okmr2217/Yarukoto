"use client";

import { Search, X, Calendar, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Category } from "@/types";
import type { SearchFilters } from "@/hooks";

type SearchFiltersProps = {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  categories: Category[];
};

export function SearchFiltersComponent({
  filters,
  onFiltersChange,
  categories,
}: SearchFiltersProps) {
  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      keyword: "",
      status: "all",
      categoryId: undefined,
      isFavorite: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const hasActiveFilters =
    filters.keyword.trim() !== "" ||
    filters.status !== "all" ||
    filters.categoryId !== undefined ||
    filters.isFavorite !== undefined ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined;

  return (
    <div className="space-y-4">
      {/* Keyword Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="キーワードを入力..."
          value={filters.keyword}
          onChange={(e) => updateFilter("keyword", e.target.value)}
          className="pl-10 pr-10"
        />
        {filters.keyword && (
          <button
            type="button"
            onClick={() => updateFilter("keyword", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
        <label className="text-sm font-medium text-muted-foreground md:w-24 shrink-0">
          ステータス
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "すべて" },
            { value: "pending", label: "未完了" },
            { value: "completed", label: "完了" },
            { value: "skipped", label: "やらない" },
          ].map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={filters.status === option.value ? "default" : "outline"}
              size="sm"
              onClick={() =>
                updateFilter("status", option.value as SearchFilters["status"])
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
        <label className="text-sm font-medium text-muted-foreground md:w-24 shrink-0">
          カテゴリ
        </label>
        <Select
          value={
            filters.categoryId === null
              ? "none"
              : (filters.categoryId ?? "all")
          }
          onValueChange={(value) => {
            if (value === "all") {
              updateFilter("categoryId", undefined);
            } else if (value === "none") {
              updateFilter("categoryId", null);
            } else {
              updateFilter("categoryId", value);
            }
          }}
        >
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="すべて" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="none">カテゴリなし</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: category.color || "#6B7280" }}
                  />
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Favorite Filter */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="favorite-filter"
          checked={filters.isFavorite === true}
          onCheckedChange={(checked) =>
            updateFilter("isFavorite", checked ? true : undefined)
          }
        />
        <label
          htmlFor="favorite-filter"
          className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
        >
          <Star className="size-4 text-yellow-500" fill="currentColor" />
          お気に入りのみ
        </label>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
        <label className="text-sm font-medium text-muted-foreground md:w-24 shrink-0 flex items-center gap-1">
          <Calendar className="size-4" />
          期間
        </label>
        <div className="flex items-center gap-2 flex-1">
          <Input
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) =>
              updateFilter("dateFrom", e.target.value || undefined)
            }
            className="flex-1"
          />
          <span className="text-muted-foreground">〜</span>
          <Input
            type="date"
            value={filters.dateTo || ""}
            onChange={(e) =>
              updateFilter("dateTo", e.target.value || undefined)
            }
            className="flex-1"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="w-full text-muted-foreground"
        >
          <X className="size-4 mr-1" />
          フィルターをクリア
        </Button>
      )}
    </div>
  );
}
