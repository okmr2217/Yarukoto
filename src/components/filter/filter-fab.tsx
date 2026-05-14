"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterFabProps {
  onClick: () => void;
  activeFilterCount: number;
}

export function FilterFab({ onClick, activeFilterCount }: FilterFabProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="icon"
      aria-label="フィルターを開く"
      className="md:hidden fixed right-4 z-40 w-12 h-12 rounded-full shadow-md"
      style={{ bottom: "calc(144px + env(safe-area-inset-bottom))" }}
    >
      <SlidersHorizontal className="h-5 w-5" />
      {activeFilterCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
          {activeFilterCount}
        </span>
      )}
    </Button>
  );
}
