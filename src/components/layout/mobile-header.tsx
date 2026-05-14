interface MobileHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function MobileHeader({ title, actions }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 md:top-12 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-[52px] items-center gap-2 px-4">
        <h1 className="text-base font-semibold flex-1">{title}</h1>
        {actions}
      </div>
    </header>
  );
}
