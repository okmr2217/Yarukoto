import Link from "next/link";
import { Settings, HelpCircle, Layers } from "lucide-react";

const MENU_ITEMS = [
  { href: "/settings", label: "設定", description: "アカウント・パスワードの管理", icon: Settings },
  { href: "/groups", label: "グループ", description: "カテゴリグループの管理", icon: Layers },
  { href: "/help", label: "ヘルプ", description: "使い方・ショートカットの説明", icon: HelpCircle },
] as const;

export default function MenuPage() {
  return (
    <div className="flex-1 bg-background">
      <main className="px-4 pt-4 pb-20 md:pb-4 md:max-w-190 space-y-4">
        <div>
          <h1 className="text-lg font-semibold mb-1.5">メニュー</h1>
        </div>

        <nav className="bg-card rounded-lg border border-border overflow-hidden">
          {MENU_ITEMS.map(({ href, label, description, icon: Icon }, i) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-4 hover:bg-accent transition-colors${i < MENU_ITEMS.length - 1 ? " border-b border-border" : ""}`}
            >
              <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
              </span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
