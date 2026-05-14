"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { arrayMove } from "@dnd-kit/sortable";
import { useSensor, useSensors, PointerSensor, TouchSensor, type DragStartEvent, type DragEndEvent } from "@dnd-kit/core";

export function useSortableDnd<T extends { id: string }>({
  items,
  queryKey,
  onSort,
}: {
  items: T[] | undefined;
  queryKey: readonly unknown[];
  onSort: (updates: { id: string; sortOrder: number }[], rollback: () => void) => void;
}) {
  const queryClient = useQueryClient();
  const [activeItem, setActiveItem] = useState<T | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = items?.find((i) => i.id === (event.active.id as string));
    setActiveItem(item ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !items) return;

    const original = items;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    queryClient.setQueryData(queryKey, reordered);

    const updates = reordered.map((item, i) => ({ id: item.id, sortOrder: i }));
    onSort(updates, () => queryClient.setQueryData(queryKey, original));
  };

  return { sensors, activeItem, handleDragStart, handleDragEnd };
}
