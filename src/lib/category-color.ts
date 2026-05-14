import type { CSSProperties } from "react";

export function categoryColorStyle(color: string, active: boolean): CSSProperties {
  return active
    ? { backgroundColor: `${color}28`, color, boxShadow: `inset 0 0 0 1.5px ${color}50` }
    : { backgroundColor: `${color}14`, color: `${color}aa`, boxShadow: "inset 0 0 0 1.5px transparent" };
}

export function categoryTreeItemStyle(color: string): CSSProperties {
  return { backgroundColor: `${color}20`, borderLeft: `3px solid ${color}` };
}
