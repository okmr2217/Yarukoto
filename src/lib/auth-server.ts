import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "./paritto-auth";
import { prisma } from "./prisma";
import { auth } from "./auth";

export type SessionUser = { id: string; email: string; name: string | null };
export type Session = { user: SessionUser };

export async function getSession(): Promise<Session | null> {
  // 1. paritto アクセストークンを確認（jose JWKS 検証）
  const cookieStore = await cookies();
  const token = cookieStore.get("paritto_access_token")?.value;
  if (token) {
    try {
      const payload = await verifyJwt(token);
      // sub (paritto user ID) → accounts テーブル経由でローカル user を引く
      const account = await prisma.account.findUnique({
        where: { providerId_accountId: { providerId: "paritto", accountId: payload.sub } },
        include: { user: { select: { id: true, email: true, name: true } } },
      });
      if (account?.user) {
        const u = account.user;
        return { user: { id: u.id, email: u.email, name: u.name } };
      }
    } catch {
      // トークン失効または不正 → better-auth にフォールバック
    }
  }

  // 2. better-auth セッション（メール/パスワードユーザー向け）
  const betterAuthSession = await auth.api.getSession({ headers: await headers() });
  if (!betterAuthSession) return null;
  return {
    user: {
      id: betterAuthSession.user.id,
      email: betterAuthSession.user.email,
      name: betterAuthSession.user.name ?? null,
    },
  };
}

export async function getRequiredSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function getRequiredUser(): Promise<SessionUser> {
  const session = await getRequiredSession();
  return session.user;
}
