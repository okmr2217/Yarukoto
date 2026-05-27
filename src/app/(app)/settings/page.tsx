import { getRequiredSession } from "@/lib/auth-server";
import { SettingsClient } from "./settings-client";

export const metadata = {
  title: "設定 | Yarukoto",
};

export default async function SettingsPage() {
  const session = await getRequiredSession();
  return <SettingsClient initialEmail={session.user.email} />;
}
