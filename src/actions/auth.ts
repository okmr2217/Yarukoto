"use server";

import { cookies } from "next/headers";

export async function clearParittoCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("paritto_access_token");
  cookieStore.delete("paritto_refresh_token");
}
