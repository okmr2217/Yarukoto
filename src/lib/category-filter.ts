export type CategoryFilter =
  | { type: "all" }
  | { type: "group"; groupId: string }
  | { type: "category"; categoryId: string };

export function parseCategoryParam(param: string | null): CategoryFilter {
  if (param === null) return { type: "all" };
  if (param.startsWith("g:")) return { type: "group", groupId: param.slice(2) };
  if (param.startsWith("c:")) return { type: "category", categoryId: param.slice(2) };
  return { type: "all" };
}

export function categoryFilterToParam(filter: CategoryFilter): string | null {
  if (filter.type === "all") return null;
  if (filter.type === "group") return `g:${filter.groupId}`;
  return `c:${filter.categoryId}`;
}
