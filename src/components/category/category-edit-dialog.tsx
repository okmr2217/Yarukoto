"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { COLOR_PRESETS } from "@/constants/colors";
import type { Category, Group } from "@/types";

interface CategoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  groups?: Group[];
  onSave: (data: { name: string; color: string; description?: string; groupId?: string | null }) => void;
  isLoading?: boolean;
}

export function CategoryEditDialog({
  open,
  onOpenChange,
  category,
  groups,
  onSave,
  isLoading = false,
}: CategoryEditDialogProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState<string>(category?.color ?? COLOR_PRESETS[4].value);
  const [description, setDescription] = useState(category?.description ?? "");
  const [groupId, setGroupId] = useState<string | null>(category?.groupId ?? null);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!category;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("カテゴリ名を入力してください");
      return;
    }

    if (trimmedName.length > 20) {
      setError("カテゴリ名は20文字以内で入力してください");
      return;
    }

    onSave({ name: trimmedName, color, description: description || undefined, groupId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "カテゴリを編集" : "新しいカテゴリ"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* カテゴリ名 */}
          <div className="space-y-2">
            <Label htmlFor="category-name">カテゴリ名</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="例: 仕事"
              maxLength={20}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* 説明文 */}
          <div className="space-y-2">
            <Label htmlFor="category-description">説明文</Label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: yarukotoリポジトリのフロントエンド改善"
              maxLength={200}
              rows={3}
            />
          </div>

          {/* グループ */}
          {groups && groups.length > 0 && (
            <div className="space-y-2">
              <Label>グループ</Label>
              <Select value={groupId ?? "__none__"} onValueChange={(v) => setGroupId(v === "__none__" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="グループなし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">グループなし</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="flex items-center gap-2">
                        {g.color && <span className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" style={{ backgroundColor: g.color }} />}
                        {g.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* カラー */}
          <div className="space-y-2">
            <Label>カラー</Label>
            <ColorPicker value={color} onChange={(v) => setColor(v ?? COLOR_PRESETS[4].value)} />
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
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
