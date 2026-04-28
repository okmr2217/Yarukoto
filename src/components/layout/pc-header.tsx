"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListTodo, Tags, Settings, BarChart2, HelpCircle } from "lucide-react";
import Image from "next/image";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { DueDateAlertChip } from "./due-date-alert-chip";

const iconMap = {
  ListTodo,
  BarChart2,
  Tags,
  Settings,
  HelpCircle,
} as const;

export function PCHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="hidden md:block sticky top-0 z-40 h-12 bg-white border-b shrink-0">
      <div className="max-w-265 mx-auto h-full px-4 flex items-end gap-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 shrink-0 self-center">
          <Image src="/icon-192.png" alt="icon" width={28} height={28} />
          <span className="text-lg font-medium font-logo">Yarukoto</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-end gap-1 flex-1 h-full">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            if (!Icon) return null;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1 px-3 pt-2 pb-3.5 rounded-t-md text-xs transition-all duration-150",
                  active
                    ? "text-foreground font-semibold bg-background border border-b-0 border-border -mb-px"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <DueDateAlertChip className="shrink-0 self-center" />
      </div>
    </header>
  );
}
