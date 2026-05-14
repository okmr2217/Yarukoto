"use client";

import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types";

interface CategoryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  isArchived?: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  isArchiving?: boolean;
  isUnarchiving?: boolean;
}

export function CategoryDetailDialog({
  open,
  onOpenChange,
  category,
  isArchived = false,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  isArchiving = false,
  isUnarchiving = false,
}: CategoryDetailDialogProps) {
  if (!category) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: category.color || "#6B7280" }} />
            <ResponsiveDialogTitle>{category.name}</ResponsiveDialogTitle>
          </div>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="px-6 py-4 space-y-3">
          {category.group && (
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {category.group.color && (
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" style={{ backgroundColor: category.group.color }} />
                )}
                {category.group.name}
              </span>
            </div>
          )}
          {category.description ? (
            <p className="text-sm text-muted-foreground">{category.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground/40">説明なし</p>
          )}
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
            <div className="flex items-center gap-2">
              {isArchived ? (
                <Button variant="outline" size="sm" onClick={onUnarchive} disabled={isUnarchiving}>
                  <ArchiveRestore className="h-4 w-4 mr-1.5" />
                  {isUnarchiving ? "処理中..." : "アーカイブ解除"}
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={onArchive} disabled={isArchiving}>
                    <Archive className="h-4 w-4 mr-1.5" />
                    {isArchiving ? "処理中..." : "アーカイブ"}
                  </Button>
                  <Button size="sm" onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-1.5" />
                    編集
                  </Button>
                </>
              )}
            </div>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
