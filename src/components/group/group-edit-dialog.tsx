"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import { isValidEmoji } from "@/utils/categoryGroup";
import type { Group } from "@/types";

const EMOJI_PRESETS = ["🛠", "💡", "🏠", "📚", "💼", "🎯", "🌱", "🎨", "🔬", "🏃", "🍳", "✈️", "💪", "🤝", "📝", "🎵"];

interface GroupEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group | null;
  onSave: (data: { name: string; emoji?: string | null; color?: string }) => void;
  isLoading?: boolean;
}

export function GroupEditDialog({ open, onOpenChange, group, onSave, isLoading = false }: GroupEditDialogProps) {
  const [name, setName] = useState(group?.name ?? "");
  const [emoji, setEmoji] = useState<string>(group?.emoji ?? "");
  const [color, setColor] = useState<string | undefined>(group?.color ?? undefined);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emojiError, setEmojiError] = useState<string | null>(null);

  const isEditing = !!group;

  const handleEmojiInput = (value: string) => {
    setEmoji(value);
    if (value && !isValidEmoji(value)) {
      setEmojiError("絵文字は2文字以内で入力してください");
    } else {
      setEmojiError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("グループ名を入力してください");
      return;
    }
    if (emoji && !isValidEmoji(emoji)) {
      setEmojiError("絵文字は2文字以内で入力してください");
      return;
    }
    onSave({ name: trimmedName, emoji: emoji || null, color });
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
              onChange={(e) => { setName(e.target.value); setNameError(null); }}
              placeholder="例: 仕事"
              maxLength={50}
              autoFocus
            />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          </div>

          <div className="space-y-2">
            <Label>絵文字（任意）</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => { setEmoji(""); setEmojiError(null); }}
                className={cn(
                  "w-8 h-8 rounded-md border-2 transition-all bg-muted flex items-center justify-center text-xs text-muted-foreground",
                  !emoji ? "border-foreground scale-110" : "border-transparent hover:scale-105",
                )}
                aria-label="なし"
              >
                ✕
              </button>
              {EMOJI_PRESETS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setEmoji(e); setEmojiError(null); }}
                  className={cn(
                    "w-8 h-8 rounded-md border-2 transition-all text-base flex items-center justify-center",
                    emoji === e ? "border-foreground scale-110 bg-muted" : "border-transparent hover:scale-105 hover:bg-muted",
                  )}
                  aria-label={e}
                >
                  {e}
                </button>
              ))}
            </div>
            <Input
              value={emoji}
              onChange={(e) => handleEmojiInput(e.target.value)}
              placeholder="または直接入力..."
              className="w-32"
            />
            {emojiError && <p className="text-sm text-destructive">{emojiError}</p>}
          </div>

          <div className="space-y-2">
            <Label>カラー（任意）</Label>
            <ColorPicker value={color} onChange={setColor} />
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
