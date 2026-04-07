"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListTodo, BarChart2, Tags, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { MenuBottomSheet } from "./menu-bottom-sheet";

const NAV_ITEMS = [
  { href: "/", label: "タスク", icon: ListTodo },
  { href: "/stats", label: "統計", icon: BarChart2 },
  { href: "/categories", label: "カテゴリ", icon: Tags },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isMenuActive = pathname.startsWith("/settings") || pathname.startsWith("/help");

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-[60px]">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
              isMenuActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">メニュー</span>
          </button>
        </div>
      </nav>

      <MenuBottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
