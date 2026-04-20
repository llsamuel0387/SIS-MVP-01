import type { SessionUser } from "@/lib/authz";
import { parseCookies } from "@/lib/http";
import { getSessionCookieName, getSessionUserFromToken } from "@/lib/session";

export function getClientIp(request: Request): string {
  // Only trust proxy headers when TRUST_PROXY=1 is explicitly set.
  // Without this guard, any client can spoof x-forwarded-for to bypass IP-based rate limiting.
  // Set TRUST_PROXY=1 only when the app runs behind a reverse proxy that overwrites this header
  // (e.g. nginx, AWS ALB, Cloudflare). Never set it when the app is exposed directly.
  if (process.env.TRUST_PROXY === "1") {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
    const xRealIp = request.headers.get("x-real-ip");
    if (xRealIp) return xRealIp.trim();
  }
  return "unknown";
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
