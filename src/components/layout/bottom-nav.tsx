"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListTodo, BarChart2, Tags, Settings, HelpCircle, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/constants";
import { MenuBottomSheet } from "./menu-bottom-sheet";

const iconMap = {
  ListTodo,
  BarChart2,
  Tags,
  Settings,
  HelpCircle,
} as const;

const BOTTOM_NAV_HREFS = new Set(["/", "/stats", "/categories"]);

export function BottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isMenuActive = pathname.startsWith("/settings") || pathname.startsWith("/help");
  const bottomNavItems = NAV_ITEMS.filter((item) => BOTTOM_NAV_HREFS.has(item.href));

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-[60px]">
          {bottomNavItems.map(({ href, label, icon }) => {
            const Icon = iconMap[icon as keyof typeof iconMap];
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
