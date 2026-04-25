"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListTodo, Tags, Settings, BarChart2, HelpCircle, X } from "lucide-react";
import Image from "next/image";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  ListTodo,
  BarChart2,
  Tags,
  Settings,
  HelpCircle,
} as const;

function countActiveFilters(searchParams: URLSearchParams): number {
  let count = 0;
  if (searchParams.get("keyword")) count++;
  const status = searchParams.get("status");
  if (status && status !== "pending") count++;
  if (searchParams.get("date")) count++;
  if (searchParams.get("favorite") === "true") count++;
  if (searchParams.get("category") !== null) count++;
  return count;
}

export function PCHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isTaskPage = pathname === "/";
  const activeFilterCount = isTaskPage ? countActiveFilters(searchParams) : 0;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="hidden md:block sticky top-0 z-40 h-12 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b shrink-0">
      <div className="max-w-265 mx-auto h-full px-4 flex items-end gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 shrink-0 self-center">
          <Image src="/icons/icon-192x192.png" alt="icon" width={24} height={24} />
          <span className="text-base font-medium font-logo">Yarukoto</span>
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
                  "flex items-center gap-1.5 px-3.5 pt-2 pb-3.5 rounded-t-md text-sm transition-all duration-150",
                  active
                    ? "text-foreground font-semibold bg-background border border-b-0 border-border -mb-px"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Filter badge + reset (task page only) */}
        {isTaskPage && activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0 self-center"
          >
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
              {activeFilterCount}
            </span>
            <span>絞り込み中</span>
            <X className="size-3" />
          </button>
        )}
      </div>
    </header>
  );
}
