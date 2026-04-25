"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, GripVertical, ChevronLeft } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  DragOverlay,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GroupEditDialog } from "@/components/group";
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup, useReorderGroups } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { Group } from "@/types";

interface SortableGroupRowProps {
  group: Group;
  onEdit: (group: Group) => void;
  onDelete: (group: Group) => void;
}

function SortableGroupRow({ group, onEdit, onDelete }: SortableGroupRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-3 min-w-0 overflow-hidden">
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
          aria-label="ドラッグして並び替え"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {group.emoji ? (
          <span className="text-base shrink-0 leading-none">{group.emoji}</span>
        ) : group.color ? (
          <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
        ) : (
          <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-border bg-muted" />
        )}
        <div className="min-w-0">
          <span className="font-medium">{group.name}</span>
          <span className="text-xs text-muted-foreground ml-2">{group.categoryCount}個のカテゴリ</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(group)} aria-label="編集">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(group)}
          aria-label="削除"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function GroupRowOverlay({ group }: { group: Group }) {
  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border shadow-lg">
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        {group.emoji ? (
          <span className="text-base shrink-0 leading-none">{group.emoji}</span>
        ) : (
          group.color && <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
        )}
        <span className="font-medium">{group.name}</span>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const { data: groups, isLoading, error } = useGroups();
  const queryClient = useQueryClient();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const reorderGroups = useReorderGroups();

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleCreate = () => {
    setEditingGroup(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setIsDialogOpen(true);
  };

  const handleSave = async (data: { name: string; emoji?: string | null; color?: string }) => {
    try {
      if (editingGroup) {
        await updateGroup.mutateAsync({ id: editingGroup.id, name: data.name, emoji: data.emoji, color: data.color });
      } else {
        await createGroup.mutateAsync({ name: data.name, emoji: data.emoji ?? undefined, color: data.color });
      }
      setIsDialogOpen(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    try {
      await deleteGroup.mutateAsync(deletingGroup.id);
      setDeletingGroup(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const g = groups?.find((g) => g.id === event.active.id);
    setActiveGroup(g ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveGroup(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !groups) return;

    const oldIndex = groups.findIndex((g) => g.id === active.id);
    const newIndex = groups.findIndex((g) => g.id === over.id);
    const reordered = arrayMove(groups, oldIndex, newIndex);

    queryClient.setQueryData<Group[]>(["groups"], reordered);

    const updates = reordered.map((g, i) => ({ id: g.id, sortOrder: i }));
    reorderGroups.mutate(updates, {
      onError: () => {
        queryClient.setQueryData<Group[]>(["groups"], groups);
      },
    });
  };

  return (
    <div className="flex-1 bg-background">
      <main className="px-4 pt-4 pb-20 md:pb-4 md:max-w-190">
        <div className="flex items-center gap-2 mb-1.5">
          <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">グループ</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          カテゴリをグループでまとめて整理できます。ドラッグで表示順を並び替えられます。
        </p>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">エラーが発生しました: {error.message}</div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={groups?.map((g) => g.id) ?? []} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {groups && groups.length > 0 ? (
                    groups.map((group) => (
                      <SortableGroupRow key={group.id} group={group} onEdit={handleEdit} onDelete={setDeletingGroup} />
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>グループがありません</p>
                      <p className="text-sm mt-1">下のボタンから新しいグループを追加しましょう</p>
                    </div>
                  )}
                </div>
              </SortableContext>

              <DragOverlay>{activeGroup && <GroupRowOverlay group={activeGroup} />}</DragOverlay>
            </DndContext>

            <button
              onClick={handleCreate}
              className="w-full mt-4 flex items-center justify-center gap-2 p-4 bg-card rounded-lg border border-dashed border-border hover:border-primary hover:bg-accent transition-colors"
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">新しいグループを追加</span>
            </button>
          </>
        )}
      </main>

      <GroupEditDialog
        key={editingGroup?.id ?? "new"}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        group={editingGroup}
        onSave={handleSave}
        isLoading={createGroup.isPending || updateGroup.isPending}
      />

      <AlertDialog open={!!deletingGroup} onOpenChange={(open) => !open && setDeletingGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>グループを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingGroup?.name}」を削除します。
              このグループに紐づいているカテゴリはグループなしになります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteGroup.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGroup.isPending ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
