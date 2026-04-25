"use client";

import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import type { GroupSelectionState } from "@/hooks/use-category-group-filter";

interface CategoryGroupAccordionProps {
  groupId: string;
  groupName: string;
  groupEmoji: string | null;
  groupColor: string | null;
  categories: Category[];
  selectedCategoryIds: string[];
  countByCategory: Record<string, number>;
  isCollapsed: boolean;
  onToggleCollapse: (groupId: string) => void;
  onToggleGroup: (groupId: string, shiftKey: boolean) => void;
  onToggleCategory: (categoryId: string) => void;
  selectionState: GroupSelectionState;
}

export function CategoryGroupAccordion({
  groupId,
  groupName,
  groupEmoji,
  groupColor,
  categories,
  selectedCategoryIds,
  countByCategory,
  isCollapsed,
  onToggleCollapse,
  onToggleGroup,
  onToggleCategory,
  selectionState,
}: CategoryGroupAccordionProps) {
  const totalCount = categories.reduce((sum, c) => sum + (countByCategory[c.id] ?? 0), 0);

  return (
    <div className="mb-1">
      {/* グループヘッダー行 */}
      <div className="flex items-center gap-0.5">
        {/* 折りたたみトグルボタン */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(groupId);
          }}
          className="shrink-0 w-5 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded"
          aria-label={isCollapsed ? "展開" : "折りたたむ"}
          aria-expanded={!isCollapsed}
          aria-controls={`group-accordion-${groupId}`}
        >
          {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>

        {/* グループ名ボタン（クリック=一括トグル、Shift+クリック=このグループのみ選択） */}
        <button
          type="button"
          onClick={(e) => onToggleGroup(groupId, e.shiftKey)}
          aria-pressed={selectionState === "all"}
          className={cn(
            "flex-1 flex items-center gap-1.5 px-1.5 py-1 rounded text-xs font-semibold transition-colors min-w-0",
            selectionState === "none"
              ? "text-muted-foreground hover:text-foreground hover:bg-accent"
              : selectionState === "all"
              ? "text-foreground"
              : "text-foreground/70",
          )}
          style={
            selectionState !== "none" && groupColor
              ? { color: groupColor }
              : undefined
          }
        >
          {groupEmoji ? (
            <span className="shrink-0 text-sm leading-none">{groupEmoji}</span>
          ) : groupColor ? (
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                selectionState === "none" ? "opacity-40" : "",
              )}
              style={{ backgroundColor: groupColor }}
            />
          ) : null}
          <span className="truncate">{groupName}</span>
          {selectionState === "partial" && (
            <span className="shrink-0 text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">一部</span>
          )}
          {totalCount > 0 && (
            <span className="ml-auto shrink-0 text-[10px] tabular-nums opacity-50">{totalCount}</span>
          )}
        </button>
      </div>

      {/* カテゴリグリッド */}
      {!isCollapsed && (
        <div
          id={`group-accordion-${groupId}`}
          className="grid grid-cols-2 gap-1 pl-5 mt-0.5"
        >
          {categories.map((category) => {
            const count = countByCategory[category.id] ?? 0;
            const active = selectedCategoryIds.includes(category.id);
            const color = category.color;
            const activeStyle = color
              ? { backgroundColor: `${color}28`, color: color, boxShadow: `inset 0 0 0 1.5px ${color}50` }
              : undefined;
            const inactiveStyle = color
              ? { backgroundColor: `${color}14`, color: `${color}aa` }
              : undefined;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onToggleCategory(category.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center justify-between px-2 py-1 rounded-md text-xs transition-colors min-w-0",
                  active ? "font-semibold" : color ? "" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                style={active ? activeStyle : inactiveStyle}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {color && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
                  <span className="truncate">{category.name}</span>
                </div>
                {count > 0 && <span className="text-xs tabular-nums shrink-0 ml-1 opacity-70">{count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
