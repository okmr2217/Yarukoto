"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, GripVertical, Archive, ArchiveRestore, Layers } from "lucide-react";
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
import { CategoryEditDialog } from "@/components/category";
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
} from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { Category } from "@/types";

interface SortableCategoryRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onArchive: (category: Category) => void;
}

function SortableCategoryRow({ category, onEdit, onDelete, onArchive }: SortableCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
    >
      <div className="flex items-center gap-3 min-w-0 overflow-hidden">
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
          aria-label="ドラッグして並び替え"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: category.color || "#6B7280" }}
        />
        <div className="min-w-0">
          <span className="font-medium">{category.name}</span>
          {category.group && (
            <span
              className="ml-2 inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {category.group.color && (
                <span className="w-2 h-2 rounded-full shrink-0 inline-block" style={{ backgroundColor: category.group.color }} />
              )}
              {category.group.name}
            </span>
          )}
          {category.description && (
            <p className="text-xs text-muted-foreground truncate">{category.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(category)} aria-label="編集">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onArchive(category)}
          aria-label="アーカイブ"
          className="text-muted-foreground hover:text-foreground"
        >
          <Archive className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(category)}
          aria-label="削除"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface ArchivedCategoryRowProps {
  category: Category;
  onUnarchive: (id: string) => void;
  onDelete: (category: Category) => void;
  isUnarchiving: boolean;
}

function ArchivedCategoryRow({ category, onUnarchive, onDelete, isUnarchiving }: ArchivedCategoryRowProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border opacity-60">
      <div className="flex items-center gap-3 min-w-0 overflow-hidden">
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: category.color || "#6B7280" }}
        />
        <div className="min-w-0">
          <span className="font-medium">{category.name}</span>
          {category.description && (
            <p className="text-xs text-muted-foreground truncate">{category.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onUnarchive(category.id)}
          disabled={isUnarchiving}
          aria-label="アーカイブ解除"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArchiveRestore className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(category)}
          aria-label="削除"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CategoryRowOverlay({ category }: { category: Category }) {
  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border shadow-lg">
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: category.color || "#6B7280" }}
        />
        <span className="font-medium">{category.name}</span>
      </div>
    </div>
  );
}

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

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
  );

  const handleCreate = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleSave = async (data: { name: string; color: string; description?: string; groupId?: string | null }) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: data.name,
          color: data.color,
          description: data.description,
          groupId: data.groupId,
        });
      } else {
        await createCategory.mutateAsync({
          name: data.name,
          color: data.color,
          description: data.description,
          groupId: data.groupId,
        });
      }
      setIsDialogOpen(false);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      setDeletingCategory(null);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleArchive = (category: Category) => {
    archiveCategory.mutate(category.id);
  };

  const handleUnarchive = (id: string) => {
    unarchiveCategory.mutate(id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const cat = categories?.find((c) => c.id === event.active.id);
    setActiveCategory(cat ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCategory(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !categories) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    // Optimistic update
    queryClient.setQueryData<Category[]>(["categories"], reordered);

    const updates = reordered.map((cat, i) => ({ id: cat.id, sortOrder: i }));
    updateSortOrder.mutate(updates, {
      onError: () => {
        queryClient.setQueryData<Category[]>(["categories"], categories);
      },
    });
  };

  return (
    <div className="flex-1 bg-background">
      <main className="px-4 pt-4 pb-20 md:pb-4 md:max-w-190">
          <div className="flex items-start justify-between mb-1.5">
            <h1 className="text-lg font-semibold">カテゴリ</h1>
            <Link href="/groups" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Layers className="h-3.5 w-3.5" />
              グループを管理
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            タスクに設定するカテゴリを管理します。色を設定してタスクを視覚的に分類できます。ドラッグで表示順を並び替えられます。
          </p>

          {/* グループフィルター */}
          {groups && groups.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-4">
              <button
                onClick={() => setGroupFilter(null)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  groupFilter === null ? "bg-foreground text-background border-foreground" : "bg-card border-border text-muted-foreground hover:border-foreground/50"
                }`}
              >
                すべて
              </button>
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGroupFilter(groupFilter === g.id ? null : g.id)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    groupFilter === g.id ? "bg-foreground text-background border-foreground" : "bg-card border-border text-muted-foreground hover:border-foreground/50"
                  }`}
                >
                  {g.color && <span className="w-2 h-2 rounded-full shrink-0 inline-block" style={{ backgroundColor: g.color }} />}
                  {g.name}
                </button>
              ))}
              <button
                onClick={() => setGroupFilter("__none__")}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  groupFilter === "__none__" ? "bg-foreground text-background border-foreground" : "bg-card border-border text-muted-foreground hover:border-foreground/50"
                }`}
              >
                グループなし
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              エラーが発生しました: {error.message}
            </div>
          ) : (
            <>
              {/* Category list */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories?.map((c) => c.id) ?? []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {(() => {
                      const filtered = categories?.filter((c) => {
                        if (groupFilter === null) return true;
                        if (groupFilter === "__none__") return !c.groupId;
                        return c.groupId === groupFilter;
                      });
                      return filtered && filtered.length > 0 ? (
                        filtered.map((category) => (
                          <SortableCategoryRow
                            key={category.id}
                            category={category}
                            onEdit={handleEdit}
                            onDelete={setDeletingCategory}
                            onArchive={handleArchive}
                          />
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>カテゴリがありません</p>
                          {!groupFilter && <p className="text-sm mt-1">下のボタンから新しいカテゴリを追加しましょう</p>}
                        </div>
                      );
                    })()}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeCategory && <CategoryRowOverlay category={activeCategory} />}
                </DragOverlay>
              </DndContext>

              {/* Add button */}
              <button
                onClick={handleCreate}
                className="w-full mt-4 flex items-center justify-center gap-2 p-4 bg-card rounded-lg border border-dashed border-border hover:border-primary hover:bg-accent transition-colors"
              >
                <Plus className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">新しいカテゴリを追加</span>
              </button>

              {/* Archived categories */}
              {archivedCategories && archivedCategories.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Archive className="h-3.5 w-3.5" />
                    アーカイブ済み
                  </h2>
                  <div className="space-y-2">
                    {archivedCategories.map((category) => (
                      <ArchivedCategoryRow
                        key={category.id}
                        category={category}
                        onUnarchive={handleUnarchive}
                        onDelete={setDeletingCategory}
                        isUnarchiving={unarchiveCategory.isPending}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
      </main>

      {/* Edit Dialog */}
      <CategoryEditDialog
        key={editingCategory?.id ?? "new"}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        category={editingCategory}
        groups={groups}
        onSave={handleSave}
        isLoading={createCategory.isPending || updateCategory.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingCategory?.name}」を削除します。
              このカテゴリに紐づいているタスクはカテゴリなしになります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
