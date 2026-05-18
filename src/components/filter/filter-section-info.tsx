"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FilterSectionInfoProps {
  content: string;
}

export function FilterSectionInfo({ content }: FilterSectionInfoProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* タップ/クリックでも開閉できるよう button にする */}
        <button
          type="button"
          className="inline-flex items-center text-muted-foreground/50 hover:text-muted-foreground transition-colors focus-visible:outline-none"
        >
          <Info className="size-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-52 text-xs leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
