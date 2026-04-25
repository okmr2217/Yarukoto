"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { Category } from "@/types";
import { CategoryChip } from "./category-chip";
import { useAllTasks, useGroups, getGroupSelectionState } from "@/hooks";
import { cn } from "@/lib/utils";
import { CATEGORY_DESELECTED_SENTINEL } from "@/lib/constants";

const UNGROUPED_VIRTUAL_ID = "__ungrouped__";

interface CategoryFilterProps {
  categories: Category[];
  isLoading?: boolean;
}

export function CategoryFilter({ categories, isLoading }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const { data: groups = [] } = useGroups();

  const categoryParam = searchParams.get("category");
  const isDefaultAllSelected = categoryParam === null;
  const isAllDeselected = categoryParam === CATEGORY_DESELECTED_SENTINEL;
  const selectedCategoryIds: string[] = isDefaultAllSelected
    ? [...categories.map((c) => c.id), "none"]
    : isAllDeselected
    ? []
    : (categoryParam?.split(",") ?? []);

  const { data: allPendingTasks } = useAllTasks({ status: "pending" });

  const pendingCountByCategory = (() => {
    if (!allPendingTasks) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    for (const task of allPendingTasks) {
      const key = task.categoryId ?? "none";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
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

  const handleToggleCategory = (categoryId: string) => {
    const next = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];

    if (next.length === 0) {
      updateSearchParams({ category: CATEGORY_DESELECTED_SENTINEL });
    } else {
      const allIds = [...categories.map((c) => c.id), "none"];
      const isAll = allIds.length === next.length && allIds.every((id) => next.includes(id));
      updateSearchParams({ category: isAll ? null : next.join(",") });
    }
  };

  const handleToggleGroup = (groupId: string) => {
    const groupCats = categories.filter((c) => c.groupId === groupId);
    const groupIds = groupCats.map((c) => c.id);
    const state = getGroupSelectionState(groupIds, selectedCategoryIds);

    if (state === "all") {
      const next = selectedCategoryIds.filter((id) => !groupIds.includes(id));
      if (next.length === 0) {
        updateSearchParams({ category: CATEGORY_DESELECTED_SENTINEL });
      } else {
        const allIds = [...categories.map((c) => c.id), "none"];
        const isAll = allIds.length === next.length && allIds.every((id) => next.includes(id));
        updateSearchParams({ category: isAll ? null : next.join(",") });
      }
    } else {
      const next = [...new Set([...selectedCategoryIds, ...groupIds])];
      const allIds = [...categories.map((c) => c.id), "none"];
      const isAll = allIds.length === next.length && allIds.every((id) => next.includes(id));
      updateSearchParams({ category: isAll ? null : next.join(",") });
    }
  };

  const handleSelectAll = () => updateSearchParams({ category: null });
  const handleDeselectAll = () => updateSearchParams({ category: CATEGORY_DESELECTED_SENTINEL });

  const noneSelected = isAllDeselected;
  const allSelected = !isLoading && isDefaultAllSelected;

  // カテゴリをグループ別に分類
  const groupedCategories: Record<string, Category[]> = {};
  const ungroupedCategories: Category[] = [];
  for (const cat of categories) {
    if (cat.groupId) {
      groupedCategories[cat.groupId] = [...(groupedCategories[cat.groupId] ?? []), cat];
    } else {
      ungroupedCategories.push(cat);
    }
  }

  // グループがある場合はグループチップ表示、ない場合はフラット表示
  const hasGroups = groups.length > 0 && categories.some((c) => c.groupId);

  const handleToggleUngroupedGroup = () => {
    const groupIds = ungroupedCategories.map((c) => c.id);
    const state = getGroupSelectionState(groupIds, selectedCategoryIds);

    if (state === "all") {
      const next = selectedCategoryIds.filter((id) => !groupIds.includes(id));
      if (next.length === 0) {
        updateSearchParams({ category: CATEGORY_DESELECTED_SENTINEL });
      } else {
        const allIds = [...categories.map((c) => c.id), "none"];
        const isAll = allIds.length === next.length && allIds.every((id) => next.includes(id));
        updateSearchParams({ category: isAll ? null : next.join(",") });
      }
    } else {
      const next = [...new Set([...selectedCategoryIds, ...groupIds])];
      const allIds = [...categories.map((c) => c.id), "none"];
      const isAll = allIds.length === next.length && allIds.every((id) => next.includes(id));
      updateSearchParams({ category: isAll ? null : next.join(",") });
    }
  };

  // 展開中グループのカテゴリ（仮想グループ対応）
  const expandedGroupCats = (() => {
    if (!expandedGroupId) return [];
    if (expandedGroupId === UNGROUPED_VIRTUAL_ID) return ungroupedCategories;
    return groupedCategories[expandedGroupId] ?? [];
  })();

  return (
    <div className="bg-background border-b">
      {/* 1行目: 全選択/解除 + グループチップまたはカテゴリチップ */}
      <div className="flex flex-wrap items-center gap-1 px-1.5 py-1.5">
        <button
          onClick={handleDeselectAll}
          className={cn(
            "text-xs px-2.5 py-1.5 rounded whitespace-nowrap transition-all shrink-0",
            noneSelected ? "bg-muted text-foreground font-semibold" : "bg-muted/50 text-muted-foreground hover:bg-muted/70",
          )}
        >
          全て解除
        </button>
        <button
          onClick={handleSelectAll}
          className={cn(
            "text-xs px-2.5 py-1.5 rounded whitespace-nowrap transition-all shrink-0",
            allSelected ? "bg-muted text-foreground font-semibold" : "bg-muted/50 text-muted-foreground hover:bg-muted/70",
          )}
        >
          全て選択
        </button>
        <div className="w-px h-4 bg-border shrink-0" />

        {isLoading ? (
          [48, 72, 56, 40].map((w, i) => (
            <div key={i} className="h-7 rounded-full bg-muted animate-pulse shrink-0" style={{ width: `${w}px` }} />
          ))
        ) : hasGroups ? (
          <>
            {/* グループチップ */}
            {groups.map((group) => {
              const groupCats = groupedCategories[group.id] ?? [];
              if (groupCats.length === 0) return null;
              const groupIds = groupCats.map((c) => c.id);
              const state = getGroupSelectionState(groupIds, selectedCategoryIds);
              const isExpanded = expandedGroupId === group.id;
              const groupCount = groupIds.reduce((sum, id) => sum + (pendingCountByCategory[id] ?? 0), 0);

              return (
                <div key={group.id} className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleGroup(group.id)}
                    className={cn(
                      "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-l-full whitespace-nowrap transition-all",
                      state === "none"
                        ? "bg-muted/50 text-muted-foreground hover:bg-muted/70"
                        : state === "all"
                        ? "bg-muted text-foreground font-semibold"
                        : "bg-muted/70 text-foreground/70 font-medium",
                    )}
                    style={state !== "none" && group.color ? { backgroundColor: `${group.color}28`, color: group.color } : undefined}
                  >
                    {group.emoji ? (
                      <span className="text-sm leading-none">{group.emoji}</span>
                    ) : group.color ? (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: group.color, opacity: state === "none" ? 0.4 : 1 }}
                      />
                    ) : null}
                    {group.name}
                    {groupCount > 0 && (
                      <span className="text-[10px] tabular-nums opacity-60">{groupCount}</span>
                    )}
                  </button>
                  {/* 展開トグル */}
                  <button
                    type="button"
                    onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                    className={cn(
                      "flex items-center justify-center text-xs px-1.5 py-1.5 rounded-r-full whitespace-nowrap transition-all border-l border-black/10",
                      state === "none"
                        ? "bg-muted/50 text-muted-foreground hover:bg-muted/70"
                        : "bg-muted/70 text-foreground/70",
                    )}
                    style={state !== "none" && group.color ? { backgroundColor: `${group.color}28`, color: group.color } : undefined}
                    aria-label={isExpanded ? "折りたたむ" : "展開"}
                    aria-expanded={isExpanded}
                  >
                    <ChevronDown className={cn("size-3 transition-transform", isExpanded && "rotate-180")} />
                  </button>
                </div>
              );
            })}

            {/* グループなし仮想グループ */}
            {ungroupedCategories.length > 0 && (() => {
              const groupIds = ungroupedCategories.map((c) => c.id);
              const state = getGroupSelectionState(groupIds, selectedCategoryIds);
              const isExpanded = expandedGroupId === UNGROUPED_VIRTUAL_ID;
              const groupCount = groupIds.reduce((sum, id) => sum + (pendingCountByCategory[id] ?? 0), 0);
              return (
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={handleToggleUngroupedGroup}
                    className={cn(
                      "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-l-full whitespace-nowrap transition-all",
                      state === "none"
                        ? "bg-muted/50 text-muted-foreground hover:bg-muted/70"
                        : state === "all"
                        ? "bg-muted text-foreground font-semibold"
                        : "bg-muted/70 text-foreground/70 font-medium",
                    )}
                  >
                    <span className="text-sm leading-none">📂</span>
                    グループなし
                    {groupCount > 0 && <span className="text-[10px] tabular-nums opacity-60">{groupCount}</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedGroupId(isExpanded ? null : UNGROUPED_VIRTUAL_ID)}
                    className={cn(
                      "flex items-center justify-center text-xs px-1.5 py-1.5 rounded-r-full whitespace-nowrap transition-all border-l border-black/10",
                      state === "none"
                        ? "bg-muted/50 text-muted-foreground hover:bg-muted/70"
                        : "bg-muted/70 text-foreground/70",
                    )}
                    aria-label={isExpanded ? "折りたたむ" : "展開"}
                    aria-expanded={isExpanded}
                  >
                    <ChevronDown className={cn("size-3 transition-transform", isExpanded && "rotate-180")} />
                  </button>
                </div>
              );
            })()}

            <button
              type="button"
              onClick={() => handleToggleCategory("none")}
              className={cn(
                "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0",
                selectedCategoryIds.includes("none")
                  ? "bg-muted text-foreground font-semibold"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted/70",
              )}
            >
              カテゴリなし
              {(pendingCountByCategory["none"] ?? 0) > 0 && (
                <span className="text-[10px] tabular-nums opacity-60">{pendingCountByCategory["none"]}</span>
              )}
            </button>
          </>
        ) : (
          <>
            {/* フラット表示（グループなし） */}
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                label={category.name}
                color={category.color}
                active={selectedCategoryIds.includes(category.id)}
                onClick={() => handleToggleCategory(category.id)}
                count={pendingCountByCategory[category.id]}
              />
            ))}
            <CategoryChip
              label="カテゴリなし"
              active={selectedCategoryIds.includes("none")}
              onClick={() => handleToggleCategory("none")}
              isSpecial
              count={pendingCountByCategory["none"]}
            />
          </>
        )}
      </div>

      {/* 2行目: 展開中グループのカテゴリチップ */}
      {hasGroups && expandedGroupId && expandedGroupCats.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 px-1.5 pb-1.5">
          {expandedGroupCats.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              color={category.color}
              active={selectedCategoryIds.includes(category.id)}
              onClick={() => handleToggleCategory(category.id)}
              count={pendingCountByCategory[category.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
