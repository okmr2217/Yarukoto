"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/types";
import { useAllTasks, useGroups } from "@/hooks";
import { cn } from "@/lib/utils";
import { parseCategoryParam, categoryFilterToParam } from "@/lib/category-filter";
import type { CategoryFilter } from "@/lib/category-filter";

const UNGROUPED_VIRTUAL_ID = "__ungrouped__";

interface CategoryFilterProps {
  categories: Category[];
  isLoading?: boolean;
}

export function CategoryFilter({ categories, isLoading }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ungroupedOpen, setUngroupedOpen] = useState(false);

  const { data: groups = [] } = useGroups();

  const categoryParam = searchParams.get("category");
  const categoryFilter = parseCategoryParam(categoryParam);

  const { data: allPendingTasks } = useAllTasks({ status: "pending" });

  const pendingCountByCategory: Record<string, number> = (() => {
    if (!allPendingTasks) return {};
    const counts: Record<string, number> = {};
    for (const task of allPendingTasks) {
      const key = task.categoryId ?? "none";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  })();

  const updateCategoryFilter = (filter: CategoryFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    const value = categoryFilterToParam(filter);
    if (value === null) {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  const groupedCategories: Record<string, Category[]> = {};
  const ungroupedCategories: Category[] = [];
  for (const cat of categories) {
    if (cat.groupId) {
      groupedCategories[cat.groupId] = [...(groupedCategories[cat.groupId] ?? []), cat];
    } else {
      ungroupedCategories.push(cat);
    }
  }

  // Derive which group area is "open" from URL state
  const urlActiveGroupId = (() => {
    if (categoryFilter.type === "group") return categoryFilter.groupId;
    if (categoryFilter.type === "category") {
      if (categoryFilter.categoryId === "none") return null;
      const cat = categories.find((c) => c.id === categoryFilter.categoryId);
      return cat?.groupId ?? UNGROUPED_VIRTUAL_ID;
    }
    return null;
  })();

  const activeGroupId = urlActiveGroupId ?? (ungroupedOpen ? UNGROUPED_VIRTUAL_ID : null);

  const stage2Categories = (() => {
    if (!activeGroupId) return [];
    if (activeGroupId === UNGROUPED_VIRTUAL_ID) return ungroupedCategories;
    return groupedCategories[activeGroupId] ?? [];
  })();

  const showStage2 = !!activeGroupId && stage2Categories.length > 0;

  const visibleGroups = groups.filter((g) => (groupedCategories[g.id]?.length ?? 0) > 0);
  const hasUngrouped = ungroupedCategories.length > 0;

  const handleGroupClick = (groupId: string) => {
    if (groupId === UNGROUPED_VIRTUAL_ID) {
      if (activeGroupId === UNGROUPED_VIRTUAL_ID) {
        setUngroupedOpen(false);
        if (categoryFilter.type !== "all") updateCategoryFilter({ type: "all" });
      } else {
        setUngroupedOpen(true);
        if (categoryFilter.type !== "all") updateCategoryFilter({ type: "all" });
      }
    } else {
      setUngroupedOpen(false);
      if (activeGroupId === groupId) {
        updateCategoryFilter({ type: "all" });
      } else {
        updateCategoryFilter({ type: "group", groupId });
      }
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryFilter.type === "category" && categoryFilter.categoryId === categoryId) {
      updateCategoryFilter({ type: "all" });
    } else {
      updateCategoryFilter({ type: "category", categoryId });
    }
  };

  const handleClearSelection = () => {
    setUngroupedOpen(false);
    updateCategoryFilter({ type: "all" });
  };

  const isFilterActive = categoryFilter.type !== "all";

  if (isLoading) {
    return (
      <div className="bg-background border-b px-2 py-2">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-9 h-9 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (visibleGroups.length === 0 && !hasUngrouped) return null;

  return (
    <div className="bg-background border-b">
      {/* Stage 1: Group emoji buttons */}
      <div className="flex items-center gap-1.5 px-2 py-2">
        {visibleGroups.map((group) => {
          const isActive = activeGroupId === group.id;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => handleGroupClick(group.id)}
              className={cn(
                "h-9 rounded-full flex items-center justify-center text-lg transition-all shrink-0",
                isActive ? "px-3 gap-0.75 shadow-sm" : "w-9 bg-muted/50 hover:bg-muted/70",
              )}
              style={
                isActive && group.color
                  ? { backgroundColor: group.color, color: "white" }
                  : isActive
                  ? { backgroundColor: "hsl(var(--muted))" }
                  : undefined
              }
              aria-pressed={isActive}
              title={group.name}
            >
              <span className="-translate-y-0.5">{group.emoji ?? group.name.slice(0, 1)}</span>
              {isActive && <span className="text-xs font-medium leading-none">{group.name}</span>}
            </button>
          );
        })}

        {hasUngrouped && (
          <button
            type="button"
            onClick={() => handleGroupClick(UNGROUPED_VIRTUAL_ID)}
            className={cn(
              "h-9 rounded-full flex items-center justify-center text-lg transition-all shrink-0",
              activeGroupId === UNGROUPED_VIRTUAL_ID ? "px-3 gap-1 bg-muted shadow-sm" : "w-9 bg-muted/50 hover:bg-muted/70",
            )}
            aria-pressed={activeGroupId === UNGROUPED_VIRTUAL_ID}
            title="グループなし"
          >
            <span className="-translate-y-0.5">📂</span>
            {activeGroupId === UNGROUPED_VIRTUAL_ID && <span className="text-xs font-medium leading-none">グループなし</span>}
          </button>
        )}

        {(() => {
          const isActive = categoryFilter.type === "category" && categoryFilter.categoryId === "none";
          return (
            <button
              type="button"
              onClick={() => handleCategoryClick("none")}
              className={cn(
                "h-9 rounded-full flex items-center justify-center text-lg transition-all shrink-0",
                isActive ? "px-3 gap-1 bg-muted shadow-sm" : "w-9 bg-muted/50 hover:bg-muted/70",
              )}
              aria-pressed={isActive}
              title="カテゴリなし"
            >
              <span className="-translate-y-0.5">🏷️</span>
              {isActive && <span className="text-xs font-medium leading-none">カテゴリなし</span>}
            </button>
          );
        })()}

        {isFilterActive && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="ml-auto text-xs px-2.5 py-1.5 rounded whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            選択解除
          </button>
        )}
      </div>

      {/* Stage 2: Category chips for selected group */}
      {showStage2 && (
        <div className="px-2 pb-2 animate-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-3 gap-1">
            {stage2Categories.map((category) => {
              const isActive = categoryFilter.type === "category" && categoryFilter.categoryId === category.id;
              const color = category.color;
              const activeStyle = color
                ? { backgroundColor: `${color}28`, color, boxShadow: `inset 0 0 0 1.5px ${color}50` }
                : undefined;
              const inactiveStyle = color
                ? { backgroundColor: `${color}14`, color: `${color}aa` }
                : undefined;
              const count = pendingCountByCategory[category.id];
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryClick(category.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex items-center justify-between gap-1 px-2 py-1.5 rounded text-xs transition-all min-w-0 font-medium",
                    isActive ? "font-semibold" : color ? "" : "bg-muted/50 text-muted-foreground hover:bg-muted/70",
                  )}
                  style={isActive ? activeStyle : inactiveStyle}
                >
                  <span className="truncate leading-tight">{category.name}</span>
                  {count !== undefined && count > 0 && (
                    <span className="tabular-nums opacity-60 shrink-0 leading-tight">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
