"use client";

import { useRef, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getTodayInJST } from "@/lib/dateUtils";
import { useFilterPanel } from "./filter-panel-context";

type StatusFilter = "all" | "pending" | "completed" | "skipped";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "未完了" },
  { value: "completed", label: "完了" },
  { value: "skipped", label: "やらない" },
];

const KEYWORD_DEBOUNCE_MS = 300;

function SidebarFilterPanelInner() {
  const pathname = usePathname();
  const { filterPanelOpen } = useFilterPanel();
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getTodayInJST();

  const dateFilter = searchParams.get("date") || "";
  const keyword = searchParams.get("keyword") || "";
  const statusFilter = (searchParams.get("status") || "all") as StatusFilter;
  const favoriteFilter = searchParams.get("favorite") === "true";
  const hasActiveFilters = !!(dateFilter || keyword || statusFilter !== "all" || favoriteFilter);

  const [localKeyword, setLocalKeyword] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  const isComposingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword);
    setLocalKeyword(keyword);
  }

  if (pathname !== "/" || !filterPanelOpen) return null;

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

  const commitKeyword = (value: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      updateSearchParams({ keyword: value || null });
    }, KEYWORD_DEBOUNCE_MS);
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalKeyword(value);
    if (!isComposingRef.current) commitKeyword(value);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    commitKeyword(e.currentTarget.value);
  };

  const handleKeywordClear = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setLocalKeyword("");
    updateSearchParams({ keyword: null });
  };

  return (
    <div className="border-t px-3 pt-2 pb-3 space-y-3">
      {/* セクションラベル */}
      <span className="block text-[11px] font-medium text-muted-foreground/70 tracking-wider pt-1">フィルター</span>

      {/* キーワード */}
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">キーワード</span>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="キーワードを入力..."
            value={localKeyword}
            onChange={handleKeywordChange}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={handleCompositionEnd}
            className="pl-8 pr-7 h-7 text-xs border-0 bg-muted/60 focus-visible:ring-1"
          />
          {localKeyword && (
            <button
              type="button"
              onClick={handleKeywordClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ステータス */}
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">ステータス</span>
        <div className="flex flex-wrap gap-1">
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={statusFilter === option.value ? "default" : "outline"}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => updateSearchParams({ status: option.value === "all" ? null : option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 日付 */}
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">日付</span>
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => updateSearchParams({ date: e.target.value || null })}
            className="h-7 text-xs flex-1 min-w-0"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs shrink-0"
            onClick={() => updateSearchParams({ date: today })}
            disabled={dateFilter === today}
          >
            今日
          </Button>
          {dateFilter && (
            <button
              type="button"
              onClick={() => updateSearchParams({ date: null })}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="日付フィルタを解除"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* お気に入り */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="sidebar-filter-favorite"
          checked={favoriteFilter}
          onCheckedChange={(checked) => updateSearchParams({ favorite: checked ? "true" : null })}
        />
        <label htmlFor="sidebar-filter-favorite" className="text-xs cursor-pointer flex items-center gap-1">
          <Star className="size-3.5 text-yellow-500" fill="currentColor" />
          お気に入りのみ
        </label>
      </div>

      {/* クリア */}
      {hasActiveFilters && (
        <div className="pt-1 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => updateSearchParams({ keyword: null, status: null, favorite: null, date: null })}
            className="w-full text-muted-foreground h-7 text-xs"
          >
            <X className="size-3.5 mr-1" />
            フィルターをクリア
          </Button>
        </div>
      )}
    </div>
  );
}

export function SidebarFilterPanel() {
  return (
    <SidebarFilterPanelInner />
  );
}
