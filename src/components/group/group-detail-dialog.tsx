"use client";

import { Pencil, Trash2 } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import type { Group } from "@/types";

interface GroupDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  categoryCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function GroupDetailDialog({ open, onOpenChange, group, categoryCount, onEdit, onDelete }: GroupDetailDialogProps) {
  if (!group) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <div className="flex items-center gap-3">
            {group.emoji ? (
              <span className="text-xl leading-none">{group.emoji}</span>
            ) : group.color ? (
              <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
            ) : (
              <div className="w-5 h-5 rounded-full shrink-0 border border-border" />
            )}
            <ResponsiveDialogTitle>{group.name}</ResponsiveDialogTitle>
          </div>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody>
          <p className="text-sm text-muted-foreground">{categoryCount}個のカテゴリ</p>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              削除
            </Button>
            <Button size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-1.5" />
              編集
            </Button>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
