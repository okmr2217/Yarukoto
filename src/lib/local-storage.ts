export function readBoolRecord(key: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function saveBoolRecord(key: string, record: Record<string, boolean>): void {
  try {
    localStorage.setItem(key, JSON.stringify(record));
  } catch {}
}
