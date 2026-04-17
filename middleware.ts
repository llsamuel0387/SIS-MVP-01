import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { maybeBlockApiForMissingCsrf } from "@/lib/api-csrf-policy";

const SESSION_COOKIE_NAME = "session_token";

const LOGIN_PATH_BY_PREFIX = {
  "/studentportal": "/studentportal/login",
  "/staffportal": "/staffportal/login",
  "/admin": "/admin/login"
} as const;

export function middleware(request: NextRequest) {
  const csrfBlock = maybeBlockApiForMissingCsrf(request);
  if (csrfBlock) {
    return csrfBlock;
  }

  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  for (const [prefix, loginPath] of Object.entries(LOGIN_PATH_BY_PREFIX)) {
    if (pathname.startsWith(prefix) && pathname !== loginPath && !hasSessionCookie) {
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/api/:path*", "/studentportal/:path*", "/staffportal/:path*", "/admin/:path*"]
};
