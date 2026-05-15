import type { CSSProperties } from "react";

export function categoryColorStyle(color: string, active: boolean): CSSProperties {
  return active
    ? { backgroundColor: color, color: "white" }
    : { backgroundColor: `${color}28`, color, boxShadow: `inset 0 0 0 1.5px ${color}65` };
}

export function categoryTreeItemStyle(color: string): CSSProperties {
  return { backgroundColor: `${color}30`, borderLeft: `3px solid ${color}` };
}
