"use client";

import { useState } from "react";
import { Menu, Settings, Tags, ListTodo, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

const iconMap = {
  ListTodo,
  Calendar,
  Tags,
  Settings,
} as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 rounded-md hover:bg-accent transition-colors" aria-label="メニューを開く">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-primary font-logo">
                Yarukoto
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-4 space-y-0.5 px-2">
              {NAV_ITEMS.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                if (!Icon) return null;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      active
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0 translate-y-px" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center">
          <Image
            src={"/icons/icon-192x192.png"}
            alt="icon"
            width={32}
            height={32}
          />
          <h1 className="text-xl font-medium font-logo">Yarukoto</h1>
        </div>

        <div className="w-10" />
      </div>
    </header>
  );
}
