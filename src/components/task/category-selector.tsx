"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getGroupEmoji } from "@/utils/categoryGroup";
import type { Category, Group } from "@/types";

const UNGROUPED_ID = "__ungrouped__";

interface VirtualGroup {
  id: string;
  name: string;
  emoji: string | null;
}

function buildTabGroups(groups: Group[], hasUngrouped: boolean): VirtualGroup[] {
  return [
    ...groups.map((g) => ({ id: g.id, name: g.name, emoji: g.emoji })),
    ...(hasUngrouped ? [{ id: UNGROUPED_ID, name: "その他", emoji: "📂" }] : []),
  ];
}

function resolveInitialGroupId(
  mode: "create" | "edit",
  selectedCategoryId: string | null,
  categories: Category[],
  groups: Group[],
  recentCategoryIds: string[],
  filterGroupId: string | undefined,
  hasUngrouped: boolean,
): string {
  const firstGroupId = groups[0]?.id ?? (hasUngrouped ? UNGROUPED_ID : UNGROUPED_ID);

  if (mode === "edit" && selectedCategoryId) {
    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (cat) return cat.groupId ?? UNGROUPED_ID;
  }

  for (const id of recentCategoryIds) {
    const cat = categories.find((c) => c.id === id && !c.archivedAt);
    if (!cat) continue;
    const gid = cat.groupId ?? UNGROUPED_ID;
    const inGroups = groups.some((g) => g.id === gid) || (gid === UNGROUPED_ID && hasUngrouped);
    if (inGroups) return gid;
  }

  if (filterGroupId) {
    const exists = groups.some((g) => g.id === filterGroupId);
    if (exists) return filterGroupId;
  }

  return firstGroupId;
}

interface CategorySelectorProps {
  categories: Category[];
  groups: Group[];
  selectedCategoryId: string | null;
  onChange: (categoryId: string | null) => void;
  mode: "create" | "edit";
  recentCategoryIds?: string[];
  filterGroupId?: string;
}

export function CategorySelector({
  categories,
  groups,
  selectedCategoryId,
  onChange,
  mode,
  recentCategoryIds = [],
  filterGroupId,
}: CategorySelectorProps) {
  const visibleCats = mode === "create"
    ? categories.filter((c) => !c.archivedAt || c.id === selectedCategoryId)
    : categories;

  const hasUngrouped = visibleCats.some((c) => !c.groupId);
  const tabGroups = buildTabGroups(groups, hasUngrouped);

  const [activeGroupId, setActiveGroupId] = useState(() =>
    resolveInitialGroupId(mode, selectedCategoryId, categories, groups, recentCategoryIds, filterGroupId, hasUngrouped),
  );

  const [prevSelectedId, setPrevSelectedId] = useState(selectedCategoryId);
  if (prevSelectedId !== selectedCategoryId) {
    setPrevSelectedId(selectedCategoryId);
    if (selectedCategoryId) {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      if (cat) setActiveGroupId(cat.groupId ?? UNGROUPED_ID);
    }
  }

  const activeCats = (() => {
    if (activeGroupId === UNGROUPED_ID) {
      return visibleCats.filter((c) => !c.groupId);
    }
    return visibleCats.filter((c) => c.groupId === activeGroupId);
  })();

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = tabGroups[idx + 1];
      if (next) setActiveGroupId(next.id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = tabGroups[idx - 1];
      if (prev) setActiveGroupId(prev.id);
    }
  };

  if (tabGroups.length === 0) {
    return (
      <div className="flex flex-wrap gap-1">
        <NoneChip selected={!selectedCategoryId} onSelect={() => onChange(null)} />
        {visibleCats.map((cat) => (
          <CategoryChip key={cat.id} cat={cat} selected={selectedCategoryId === cat.id} onSelect={() => onChange(cat.id)} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* グループタブ */}
      <div
        role="tablist"
        aria-label="カテゴリグループ"
        className="flex items-center border-b border-border overflow-x-auto scrollbar-none"
      >
        {tabGroups.map((group, idx) => {
          const isActive = activeGroupId === group.id;
          const emoji = group.id === UNGROUPED_ID ? "📂" : getGroupEmoji(group.emoji);
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveGroupId(group.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className={cn(
                "shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap border-b-2 -mb-px",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="text-sm leading-none">{emoji}</span>
            </button>
          );
        })}

        {/* × なし: タブ末尾、クリックで即 null */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 ml-auto flex items-center gap-0.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap border-b-2 border-transparent -mb-px"
        >
          <span className="text-[10px]">×</span>
          <span>なし</span>
        </button>
      </div>

      {/* カテゴリチップ */}
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {activeCats.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">カテゴリがありません</p>
        ) : (
          activeCats.map((cat) => (
            <CategoryChip
              key={cat.id}
              cat={cat}
              selected={selectedCategoryId === cat.id}
              onSelect={() => onChange(cat.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  cat,
  selected,
  onSelect,
}: {
  cat: Category;
  selected: boolean;
  onSelect: () => void;
}) {
  const isArchived = !!cat.archivedAt;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "px-2.5 py-1 rounded-full text-xs border-2 transition-colors flex items-center gap-1",
        selected ? "border-primary" : "border-border hover:bg-accent",
        isArchived && "opacity-60",
      )}
      style={{
        backgroundColor: selected && cat.color ? `${cat.color}20` : undefined,
        borderColor: selected && cat.color ? cat.color : undefined,
      }}
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color || "#6B7280" }} />
      {cat.name}
      {isArchived && <span className="text-[10px] opacity-60">（アーカイブ）</span>}
    </button>
  );
}

function NoneChip({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "px-2.5 py-1 rounded-full text-xs border-2 transition-colors",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent",
      )}
    >
      なし
    </button>
  );
}
