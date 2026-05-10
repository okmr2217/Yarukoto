export type StatusFilter = "all" | "pending" | "completed" | "skipped";
export type ViewMode = "list" | "schedule";
export type ListSortOrder = "displayOrder" | "createdAt";
export type ScheduledSortOrder = "scheduledAt_asc" | "scheduledAt_desc" | "createdAt";

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "未完了" },
  { value: "completed", label: "完了" },
  { value: "skipped", label: "やらない" },
];

export const LIST_SORT_OPTIONS: { value: ListSortOrder; label: string }[] = [
  { value: "displayOrder", label: "表示順" },
  { value: "createdAt", label: "作成日時" },
];

export const SCHEDULED_SORT_OPTIONS: { value: ScheduledSortOrder; label: string }[] = [
  { value: "scheduledAt_asc", label: "予定日（近い順）" },
  { value: "scheduledAt_desc", label: "予定日（遠い順）" },
  { value: "createdAt", label: "作成日時" },
];

export const KEYWORD_DEBOUNCE_MS = 300;
