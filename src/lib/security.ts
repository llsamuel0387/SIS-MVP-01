import type { SessionUser } from "@/lib/authz";
import { parseCookies } from "@/lib/http";
import { getSessionCookieName, getSessionUserFromToken } from "@/lib/session";

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }
  return authorization.slice("Bearer ".length).trim();
}

function getCookieToken(request: Request, cookieName: string): string | null {
  return parseCookies(request)[cookieName] ?? null;
}

export function getSessionTokenFromRequest(request: Request): string | null {
  return getBearerToken(request) ?? getCookieToken(request, getSessionCookieName()) ?? getCookieToken(request, "access_token");
}

export async function getSessionUserFromRequest(request: Request): Promise<SessionUser> {
  const token = getSessionTokenFromRequest(request);
  if (!token) {
    throw new Error("Unauthorized: missing auth session");
  }

  const user = await getSessionUserFromToken(token);
  if (!user) {
    throw new Error("Unauthorized: invalid or expired session");
  }
  return user;
}
