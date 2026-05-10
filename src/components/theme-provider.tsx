"use client";

import { useTheme } from "@/hooks";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}
