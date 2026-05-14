"use client";

import { useState } from "react";
import { Plus, GripVertical, Archive, Pencil, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  type DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { CategoryEditDialog, CategoryDetailDialog } from "@/components/category";
import { GroupEditDialog } from "@/components/group";
import {
  useCategories,
  useArchivedCategories,
  useCreateCategory,
  useUpdateCategory,
  useUpdateCategorySortOrder,
  useDeleteCategory,
  useArchiveCategory,
  useUnarchiveCategory,
  useGroups,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useReorderGroups,
  useSortableDnd,
} from "@/hooks";
import type { Category, Group } from "@/types";

// ─── Compact category cards ───────────────────────────────────────────────────

function SortableCategoryCard({ category, onClick }: { category: Category; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 bg-background rounded border border-border cursor-pointer hover:bg-accent transition-colors"
      onClick={onClick}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
        aria-label="ドラッグして並び替え"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color || "#6B7280" }} />
      <span className="text-sm flex-1 truncate">{category.name}</span>
    </div>
  );
}

function ArchivedCategoryCard({ category, onClick }: { category: Category; onClick: () => void }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-background rounded border border-border cursor-pointer hover:bg-accent transition-colors"
      onClick={onClick}
    >
      <div className="w-3.5 h-3.5 shrink-0" />
      <div className="w-3 h-3 rounded-full shrink-0 opacity-40" style={{ backgroundColor: category.color || "#6B7280" }} />
      <span className="text-sm flex-1 truncate text-muted-foreground">{category.name}</span>
      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
        <Archive className="h-2.5 w-2.5" />
        アーカイブ済み
      </span>
    </div>
  );
}

function CategoryCardOverlay({ category }: { category: Category }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background rounded border border-border shadow-lg">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color || "#6B7280" }} />
      <span className="text-sm">{category.name}</span>
    </div>
  );
}

// ─── Inner DnD list (categories within a group) ───────────────────────────────

function GroupCategoryList({
  activeCategories,
  archivedCategories,
  onDragEnd,
  onCategoryClick,
}: {
  activeCategories: Category[];
  archivedCategories: Category[];
  onDragEnd: (event: DragEndEvent) => void;
  onCategoryClick: (cat: Category, archived: boolean) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );
  const [activeCat, setActiveCat] = useState<Category | null>(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveCat(activeCategories.find((c) => c.id === (e.active.id as string)) ?? null)}
      onDragEnd={(e) => {
        setActiveCat(null);
        onDragEnd(e);
      }}
    >
      <SortableContext items={activeCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5 px-3 pb-3 pt-1">
          {activeCategories.map((cat) => (
            <SortableCategoryCard key={cat.id} category={cat} onClick={() => onCategoryClick(cat, false)} />
          ))}
          {archivedCategories.map((cat) => (
            <ArchivedCategoryCard key={cat.id} category={cat} onClick={() => onCategoryClick(cat, true)} />
          ))}
          {activeCategories.length === 0 && archivedCategories.length === 0 && (
            <p className="text-xs text-muted-foreground py-1.5 pl-1">カテゴリなし</p>
          )}
        </div>
      </SortableContext>
      <DragOverlay>{activeCat && <CategoryCardOverlay category={activeCat} />}</DragOverlay>
    </DndContext>
  );
}

// ─── Sortable group section (outer DnD) ───────────────────────────────────────

interface SortableGroupSectionProps {
  group: Group;
  activeCategories: Category[];
  archivedCategories: Category[];
  onEdit: () => void;
  onDelete: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onCategoryClick: (cat: Category, archived: boolean) => void;
}

function SortableGroupSection({ group, activeCategories, archivedCategories, onEdit, onDelete, onDragEnd, onCategoryClick }: SortableGroupSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 border-b border-border">
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
          aria-label="ドラッグして並び替え"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {group.emoji ? (
          <span className="text-base leading-none shrink-0">{group.emoji}</span>
        ) : group.color ? (
          <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
        ) : (
          <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-border" />
        )}
        <span className="font-medium text-sm flex-1 truncate">{group.name}</span>
        <span className="text-xs text-muted-foreground shrink-0 mr-1">{activeCategories.length + archivedCategories.length}個</span>
        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="編集">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="削除" className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <GroupCategoryList
        activeCategories={activeCategories}
        archivedCategories={archivedCategories}
        onDragEnd={onDragEnd}
        onCategoryClick={onCategoryClick}
      />
    </div>
  );
}

function GroupSectionOverlay({ group }: { group: Group }) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        {group.emoji ? (
          <span className="text-base leading-none shrink-0">{group.emoji}</span>
        ) : group.color ? (
          <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
        ) : null}
        <span className="font-medium text-sm">{group.name}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useCategories();
  const { data: archivedCategories } = useArchivedCategories();
  const { data: groups } = useGroups();
  const queryClient = useQueryClient();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const updateSortOrder = useUpdateCategorySortOrder();
  const deleteCategory = useDeleteCategory();
  const archiveCategory = useArchiveCategory();
  const unarchiveCategory = useUnarchiveCategory();

  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const reorderGroups = useReorderGroups();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [detailCategory, setDetailCategory] = useState<Category | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailArchived, setIsDetailArchived] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  // Group-level DnD (outer context)
  const { sensors: groupSensors, activeItem: activeGroup, handleDragStart: handleGroupDragStart, handleDragEnd: handleGroupDragEnd } = useSortableDnd<Group>({
    items: groups,
    queryKey: ["groups"],
    onSort: (updates, rollback) => reorderGroups.mutate(updates, { onError: rollback }),
  });

  // Per-group category DnD (inner contexts)
  const handleCategoryDragEnd = (event: DragEndEvent, groupId: string | null) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !categories) return;

    const groupCats = categories.filter((c) => (groupId === null ? !c.groupId : c.groupId === groupId));
    const oldIndex = groupCats.findIndex((c) => c.id === (active.id as string));
    const newIndex = groupCats.findIndex((c) => c.id === (over.id as string));
    if (oldIndex === -1 || newIndex === -1) return;

    const original = categories;
    const reordered = arrayMove(groupCats, oldIndex, newIndex);
    const reorderedSet = new Set(reordered.map((c) => c.id));

    queryClient.setQueryData<Category[]>(
      ["categories"],
      categories.map((c) => {
        if (!reorderedSet.has(c.id)) return c;
        return { ...c, sortOrder: reordered.findIndex((r) => r.id === c.id) };
      }),
    );

    const updates = reordered.map((c, i) => ({ id: c.id, sortOrder: i }));
    updateSortOrder.mutate(updates, { onError: () => queryClient.setQueryData(["categories"], original) });
  };

  // Category handlers
  const handleOpenDetail = (category: Category, archived: boolean) => {
    setDetailCategory(category);
    setIsDetailArchived(archived);
    setIsDetailOpen(true);
  };

  const handleDetailEdit = () => {
    setIsDetailOpen(false);
    setEditingCategory(detailCategory);
    setIsEditDialogOpen(true);
  };

  const handleDetailArchive = () => {
    if (detailCategory) {
      archiveCategory.mutate(detailCategory.id);
      setIsDetailOpen(false);
    }
  };

  const handleDetailUnarchive = () => {
    if (detailCategory) {
      unarchiveCategory.mutate(detailCategory.id);
      setIsDetailOpen(false);
    }
  };

  const handleDetailDelete = () => {
    setIsDetailOpen(false);
    setDeletingCategory(detailCategory);
  };

  const handleSaveCategory = async (data: { name: string; color: string; description?: string; groupId?: string | null }) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, ...data });
      } else {
        await createCategory.mutateAsync(data);
      }
      setIsEditDialogOpen(false);
    } catch {
      // handled by mutation
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      setDeletingCategory(null);
    } catch {
      // handled by mutation
    }
  };

  // Group handlers
  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setIsGroupDialogOpen(true);
  };

  const handleSaveGroup = async (data: { name: string; emoji?: string | null; color?: string }) => {
    try {
      if (editingGroup) {
        await updateGroup.mutateAsync({ id: editingGroup.id, ...data });
      } else {
        await createGroup.mutateAsync({ name: data.name, emoji: data.emoji ?? undefined, color: data.color });
      }
      setIsGroupDialogOpen(false);
    } catch {
      // handled by mutation
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    try {
      await deleteGroup.mutateAsync(deletingGroup.id);
      setDeletingGroup(null);
    } catch {
      // handled by mutation
    }
  };

  // Grouped data
  const active = categories ?? [];
  const archived = archivedCategories ?? [];
  const allGroups = groups ?? [];

  const activeByGroup = active.reduce<Record<string, Category[]>>((acc, c) => {
    const key = c.groupId ?? "__none__";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  const archivedByGroup = archived.reduce<Record<string, Category[]>>((acc, c) => {
    const key = c.groupId ?? "__none__";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  const ungroupedActive = activeByGroup["__none__"] ?? [];
  const ungroupedArchived = archivedByGroup["__none__"] ?? [];
  const showUngrouped = ungroupedActive.length > 0 || ungroupedArchived.length > 0 || allGroups.length === 0;

  return (
    <div className="flex-1 bg-background">
      <main className="px-4 pt-4 pb-20 md:pb-4 md:max-w-190">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">カテゴリ</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditingGroup(null); setIsGroupDialogOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              グループ
            </Button>
            <Button size="sm" onClick={() => { setEditingCategory(null); setIsEditDialogOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              カテゴリ
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">エラーが発生しました: {error.message}</div>
        ) : (
          <DndContext
            sensors={groupSensors}
            collisionDetection={closestCenter}
            onDragStart={handleGroupDragStart}
            onDragEnd={handleGroupDragEnd}
          >
            <SortableContext items={allGroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {allGroups.map((group) => (
                  <SortableGroupSection
                    key={group.id}
                    group={group}
                    activeCategories={activeByGroup[group.id] ?? []}
                    archivedCategories={archivedByGroup[group.id] ?? []}
                    onEdit={() => handleEditGroup(group)}
                    onDelete={() => setDeletingGroup(group)}
                    onDragEnd={(e) => handleCategoryDragEnd(e, group.id)}
                    onCategoryClick={handleOpenDetail}
                  />
                ))}

                {showUngrouped && (
                  <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 border-b border-border">
                      <div className="w-4 h-4 shrink-0" />
                      <span className="font-medium text-sm flex-1 text-muted-foreground">グループなし</span>
                      <span className="text-xs text-muted-foreground shrink-0 mr-1">{ungroupedActive.length + ungroupedArchived.length}個</span>
                    </div>
                    <GroupCategoryList
                      activeCategories={ungroupedActive}
                      archivedCategories={ungroupedArchived}
                      onDragEnd={(e) => handleCategoryDragEnd(e, null)}
                      onCategoryClick={handleOpenDetail}
                    />
                  </div>
                )}
              </div>
            </SortableContext>

            <DragOverlay>{activeGroup && <GroupSectionOverlay group={activeGroup} />}</DragOverlay>
          </DndContext>
        )}
      </main>

      <CategoryDetailDialog
        key={detailCategory?.id}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        category={detailCategory}
        isArchived={isDetailArchived}
        onEdit={handleDetailEdit}
        onArchive={handleDetailArchive}
        onUnarchive={handleDetailUnarchive}
        onDelete={handleDetailDelete}
        isArchiving={archiveCategory.isPending}
        isUnarchiving={unarchiveCategory.isPending}
      />

      <CategoryEditDialog
        key={editingCategory?.id ?? "new"}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        category={editingCategory}
        groups={groups}
        onSave={handleSaveCategory}
        isLoading={createCategory.isPending || updateCategory.isPending}
      />

      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingCategory?.name}」を削除します。このカテゴリに紐づいているタスクはカテゴリなしになります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} disabled={deleteCategory.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteCategory.isPending ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GroupEditDialog
        key={editingGroup?.id ?? "new"}
        open={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        group={editingGroup}
        onSave={handleSaveGroup}
        isLoading={createGroup.isPending || updateGroup.isPending}
      />

      <AlertDialog open={!!deletingGroup} onOpenChange={(open) => !open && setDeletingGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>グループを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingGroup?.name}」を削除します。このグループに紐づいているカテゴリはグループなしになります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} disabled={deleteGroup.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteGroup.isPending ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
