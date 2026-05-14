"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGroups, useGroupExpanded } from "@/hooks";
import type { Category } from "@/types";
import { type CategoryFilter, UNGROUPED_VIRTUAL_ID } from "@/lib/category-filter";

interface FilterCategoryTreeProps {
  categories: Category[];
  categoriesLoading: boolean;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  countByCategory: Record<string, number>;
}

export function FilterCategoryTree({
  categories,
  categoriesLoading,
  categoryFilter,
  onCategoryFilterChange,
  countByCategory,
}: FilterCategoryTreeProps) {
  const { data: groups = [] } = useGroups();
  const { isExpanded, toggle } = useGroupExpanded();

  const groupedCategories = (() => {
    const byGroup: Record<string, Category[]> = {};
    const ungrouped: Category[] = [];
    for (const cat of categories) {
      if (cat.groupId) {
        byGroup[cat.groupId] = [...(byGroup[cat.groupId] ?? []), cat];
      } else {
        ungrouped.push(cat);
      }
    }
    return { byGroup, ungrouped };
  })();

  const hasGroups = groups.length > 0 && categories.some((c) => c.groupId);

  if (categoriesLoading) {
    return (
      <div className="space-y-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-6 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const CategoryItem = ({ cat, indent = false }: { cat: Category; indent?: boolean }) => {
    const count = countByCategory[cat.id] ?? 0;
    const isCatSelected = categoryFilter.type === "category" && categoryFilter.categoryId === cat.id;
    const catColor = cat.color;
    return (
      <button
        key={cat.id}
        type="button"
        onClick={() => onCategoryFilterChange(isCatSelected ? { type: "all" } : { type: "category", categoryId: cat.id })}
        aria-pressed={isCatSelected}
        className={cn(
          "flex items-center gap-1.5 w-full py-[3px] rounded-md text-[11px] transition-colors min-w-0 text-left",
          isCatSelected ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/40",
          !isCatSelected && "px-1.5",
          indent && "pr-1.5",
        )}
        style={
          isCatSelected && catColor
            ? { backgroundColor: `${catColor}20`, borderLeft: `3px solid ${catColor}`, paddingLeft: "calc(6px - 3px)" }
            : {}
        }
      >
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", !isCatSelected && "opacity-40")}
          style={catColor ? { backgroundColor: catColor } : {}}
        />
        <span className="truncate flex-1">{cat.name}</span>
        {count > 0 && <span className="text-[10px] tabular-nums shrink-0 opacity-70">{count}</span>}
      </button>
    );
  };

  return (
    <div>
      {groups.map((group) => {
        const groupCats = groupedCategories.byGroup[group.id] ?? [];
        if (groupCats.length === 0) return null;
        const isGroupSelected = categoryFilter.type === "group" && categoryFilter.groupId === group.id;
        const expanded = isExpanded(group.id);
        const groupColor = group.color;

        return (
          <div key={group.id} className="mb-0.5">
            <div
              className="flex items-center w-full rounded-md text-[11px] overflow-hidden"
              style={
                isGroupSelected && groupColor
                  ? { backgroundColor: `${groupColor}26`, borderLeft: `3px solid ${groupColor}`, paddingLeft: "calc(0.375rem - 3px)" }
                  : {}
              }
            >
              <button
                type="button"
                onClick={() => onCategoryFilterChange(isGroupSelected ? { type: "all" } : { type: "group", groupId: group.id })}
                className={cn(
                  "flex items-center gap-1.5 flex-1 py-[3px] transition-colors min-w-0",
                  isGroupSelected ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/40",
                  !isGroupSelected && "px-1.5",
                )}
              >
                {group.emoji && <span className="shrink-0 text-sm leading-none">{group.emoji}</span>}
                <span className="truncate">{group.name}</span>
              </button>
              <button
                type="button"
                onClick={() => toggle(group.id)}
                className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mr-0.5"
                aria-label={expanded ? "折りたたむ" : "展開する"}
              >
                <ChevronDown className={cn("size-2.5 transition-transform duration-150", expanded && "rotate-180")} />
              </button>
            </div>

            {expanded && (
              <div className="ml-3">
                {groupCats.map((cat) => <CategoryItem key={cat.id} cat={cat} indent />)}
              </div>
            )}
          </div>
        );
      })}

      {groupedCategories.ungrouped.length > 0 && hasGroups && (
        <div className="mb-0.5">
          {(() => {
            const isUngroupedSelected = categoryFilter.type === "group" && categoryFilter.groupId === UNGROUPED_VIRTUAL_ID;
            return (
              <>
                <div
                  className="flex items-center w-full rounded-md text-[11px] overflow-hidden"
                  style={
                    isUngroupedSelected
                      ? { backgroundColor: "var(--muted)", borderLeft: `3px solid color-mix(in oklch, var(--muted-foreground) 40%, transparent)`, paddingLeft: "calc(0.375rem - 3px)" }
                      : {}
                  }
                >
                  <button
                    type="button"
                    onClick={() => onCategoryFilterChange(isUngroupedSelected ? { type: "all" } : { type: "group", groupId: UNGROUPED_VIRTUAL_ID })}
                    className={cn(
                      "flex items-center gap-1.5 flex-1 py-[3px] transition-colors min-w-0",
                      isUngroupedSelected ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/40",
                      !isUngroupedSelected && "px-1.5",
                    )}
                  >
                    <span className="shrink-0 text-sm leading-none">🗂️</span>
                    <span className="truncate">グループなし</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(UNGROUPED_VIRTUAL_ID)}
                    className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mr-0.5"
                    aria-label={isExpanded(UNGROUPED_VIRTUAL_ID) ? "折りたたむ" : "展開する"}
                  >
                    <ChevronDown className={cn("size-2.5 transition-transform duration-150", isExpanded(UNGROUPED_VIRTUAL_ID) && "rotate-180")} />
                  </button>
                </div>
                {isExpanded(UNGROUPED_VIRTUAL_ID) && (
                  <div className="ml-3">
                    {groupedCategories.ungrouped.map((cat) => <CategoryItem key={cat.id} cat={cat} indent />)}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {groupedCategories.ungrouped.length > 0 && !hasGroups && (
        <div className="mt-0.5">
          {groupedCategories.ungrouped.map((cat) => <CategoryItem key={cat.id} cat={cat} />)}
        </div>
      )}

      {(groups.length > 0 || groupedCategories.ungrouped.length > 0) && <div className="my-1 border-t border-border" />}

      {(() => {
        const count = countByCategory["none"] ?? 0;
        const isNoneSelected = categoryFilter.type === "category" && categoryFilter.categoryId === "none";
        return (
          <div className="mb-0.5">
            <div
              className="flex items-center w-full rounded-md text-[11px] overflow-hidden"
              style={
                isNoneSelected
                  ? { backgroundColor: "var(--muted)", borderLeft: `3px solid color-mix(in oklch, var(--muted-foreground) 40%, transparent)`, paddingLeft: "calc(0.375rem - 3px)" }
                  : {}
              }
            >
              <button
                type="button"
                onClick={() => onCategoryFilterChange(isNoneSelected ? { type: "all" } : { type: "category", categoryId: "none" })}
                aria-pressed={isNoneSelected}
                className={cn(
                  "flex items-center gap-1.5 flex-1 pr-1.5 py-[3px] transition-colors min-w-0",
                  isNoneSelected ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/40",
                  !isNoneSelected && "px-1.5",
                )}
              >
                <span className="shrink-0 text-sm leading-none">🏷️</span>
                <span className="truncate">カテゴリなし</span>
                {count > 0 && <span className="ml-auto shrink-0 text-[10px] tabular-nums opacity-70">{count}</span>}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
