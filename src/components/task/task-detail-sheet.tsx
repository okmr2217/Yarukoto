"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { TaskDetailContent } from "./task-detail-content";
import type { Task } from "@/types";

export interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export function TaskDetailSheet({ task, open, onClose }: TaskDetailSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!task) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{task.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-1">
            <TaskDetailContent task={task} onClose={onClose} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-base font-semibold text-left">{task.title}</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="max-h-[85vh] px-4 pb-6">
          <TaskDetailContent task={task} onClose={onClose} />
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
