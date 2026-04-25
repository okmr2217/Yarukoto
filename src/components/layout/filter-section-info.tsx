"use client";

import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface FilterSectionInfoProps {
  content: string;
}

export function FilterSectionInfo({ content }: FilterSectionInfoProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  return (
    <Tooltip open={isTouchDevice ? open : undefined} onOpenChange={isTouchDevice ? setOpen : undefined}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="説明を表示"
          onClick={(e) => {
            e.stopPropagation();
            if (isTouchDevice) setOpen((prev) => !prev);
          }}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted/60 text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground transition-colors shrink-0"
        >
          <Info className="size-2.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={6} className="max-w-48 leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
