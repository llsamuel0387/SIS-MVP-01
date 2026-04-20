import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { maybeBlockApiForMissingCsrf } from "@/lib/api-csrf-policy";

const SESSION_COOKIE_NAME = "session_token";

const LOGIN_PATH_BY_PREFIX = {
  "/studentportal": "/studentportal/login",
  "/staffportal": "/staffportal/login",
  "/admin": "/admin/login"
} as const;

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  // 'strict-dynamic' trusts scripts loaded by the nonce-bearing bootstrap script,
  // covering Next.js's dynamically injected chunks without needing unsafe-inline.
  // 'unsafe-eval' is kept in dev only for hot-module replacement.
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  // CSRF guard — no-op for non-API or safe HTTP methods (returns null)
  const csrfBlock = await maybeBlockApiForMissingCsrf(request);
  if (csrfBlock) return csrfBlock;

  // Session redirect for portal routes
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  for (const [prefix, loginPath] of Object.entries(LOGIN_PATH_BY_PREFIX)) {
    if (pathname.startsWith(prefix) && pathname !== loginPath && !hasSessionCookie) {
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
  }

  // Generate a per-request nonce and pass it to the route handler via request header.
  // Next.js App Router reads x-nonce and applies it to its own generated script tags,
  // eliminating the need for unsafe-inline.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders }
  });

  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  // Match all routes except Next.js static assets and images (they don't serve HTML)
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"]
};
