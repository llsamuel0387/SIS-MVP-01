import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/lib/authz";
import { getSessionCookieName, getSessionUserFromToken } from "@/lib/session";

export async function requireRolePageGuard(requiredRole: SessionUser["role"], loginPath: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (!token) {
    redirect(loginPath);
  }

  const sessionUser = await getSessionUserFromToken(token);
  if (!sessionUser || sessionUser.role !== requiredRole) {
    redirect(loginPath);
  }

  return sessionUser;
}
