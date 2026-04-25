"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Group } from "@/types";

const GROUP_COLORS = [
  { name: "レッド",       value: "#EF4444" },
  { name: "ローズ",       value: "#F43F5E" },
  { name: "ピンク",       value: "#EC4899" },
  { name: "オレンジ",     value: "#F97316" },
  { name: "アンバー",     value: "#F59E0B" },
  { name: "イエロー",     value: "#EAB308" },
  { name: "ライム",       value: "#84CC16" },
  { name: "グリーン",     value: "#22C55E" },
  { name: "エメラルド",   value: "#10B981" },
  { name: "ティール",     value: "#14B8A6" },
  { name: "スカイ",       value: "#0EA5E9" },
  { name: "ブルー",       value: "#3B82F6" },
  { name: "インディゴ",   value: "#6366F1" },
  { name: "バイオレット", value: "#8B5CF6" },
  { name: "スレート",     value: "#64748B" },
  { name: "ストーン",     value: "#78716C" },
];

interface GroupEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group | null;
  onSave: (data: { name: string; color?: string }) => void;
  isLoading?: boolean;
}

export function GroupEditDialog({ open, onOpenChange, group, onSave, isLoading = false }: GroupEditDialogProps) {
  const [name, setName] = useState(group?.name ?? "");
  const [color, setColor] = useState<string | undefined>(group?.color ?? undefined);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!group;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("グループ名を入力してください");
      return;
    }
    onSave({ name: trimmedName, color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "グループを編集" : "新しいグループ"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="group-name">グループ名</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="例: 仕事"
              maxLength={50}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label>カラー（任意）</Label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setColor(undefined)}
                className={cn(
                  "w-7 h-7 rounded-full border-2 transition-all bg-muted flex items-center justify-center text-xs text-muted-foreground",
                  !color ? "border-foreground scale-110" : "border-transparent hover:scale-105",
                )}
                aria-label="なし"
              >
                ✕
              </button>
              {GROUP_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all",
                    color === c.value ? "border-foreground scale-110" : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
