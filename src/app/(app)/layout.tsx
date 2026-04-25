import { getRequiredSession } from "@/lib/auth-server";
import { PCHeader, BottomNav } from "@/components/layout";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getRequiredSession();

  return (
    <div className="min-h-screen flex flex-col">
      <PCHeader />
      <div className="flex-1 max-w-265 mx-auto w-full flex flex-col">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
