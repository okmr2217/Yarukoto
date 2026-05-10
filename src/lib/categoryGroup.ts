export function getGroupEmoji(emoji: string | null | undefined): string {
  return emoji ?? "📁";
}

export function isValidEmoji(value: string): boolean {
  return Array.from(value).length <= 2;
}
