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

function SelectionIndicator({ state }: { state: GroupSelectionState }) {
  if (state === "all") {
    return <span className="shrink-0 w-2 h-2 rounded-full bg-foreground" />;
  }
  if (state === "partial") {
    return (
      <span className="shrink-0 w-2 h-2 rounded-full border border-foreground/40 overflow-hidden flex items-center">
        <span className="block w-1 h-2 bg-foreground" />
      </span>
    );
  }
  return <span className="shrink-0 w-2 h-2 rounded-full border border-foreground/30" />;
}

export function CategoryGroupAccordion({
  groupId,
  groupName,
  groupEmoji,
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
    <div className="mb-0.5">
      {/* グループヘッダー行 */}
      <div className="flex items-center gap-0.5">
        {/* chevronクリック→開閉のみ */}
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

        {/* 絵文字〜件数クリック→グループ一括トグル（開閉は変わらない） */}
        <button
          type="button"
          onClick={(e) => onToggleGroup(groupId, e.shiftKey)}
          aria-pressed={selectionState === "all"}
          aria-label="グループのカテゴリを全選択"
          className={cn(
            "flex-1 flex items-center gap-1.5 px-1.5 py-1 rounded text-xs font-semibold transition-colors min-w-0",
            selectionState === "none"
              ? "text-muted-foreground hover:text-foreground hover:bg-accent"
              : "text-foreground",
          )}
        >
          <SelectionIndicator state={selectionState} />
          {groupEmoji && <span className="shrink-0 text-sm leading-none">{groupEmoji}</span>}
          <span className="truncate">{groupName}</span>
          {totalCount > 0 && (
            <span className="ml-auto shrink-0 text-[10px] tabular-nums opacity-50">{totalCount}</span>
          )}
        </button>
      </div>

      {/* カテゴリ縦リスト */}
      {!isCollapsed && (
        <div id={`group-accordion-${groupId}`} className="mt-0.5">
          {categories.map((category) => {
            const count = countByCategory[category.id] ?? 0;
            const active = selectedCategoryIds.includes(category.id);
            const color = category.color;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onToggleCategory(category.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-1.5 w-full pl-[22px] pr-2 py-[3px] rounded-md text-[11px] transition-colors min-w-0",
                  active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-accent/40",
                )}
              >
                <span
                  className={cn("w-1.5 h-1.5 rounded-full shrink-0", !active && "opacity-40")}
                  style={color ? { backgroundColor: color } : {}}
                />
                <span className="truncate flex-1">{category.name}</span>
                {count > 0 && <span className="text-[10px] tabular-nums shrink-0 opacity-70">{count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
