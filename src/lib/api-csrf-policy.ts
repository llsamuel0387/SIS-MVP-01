import type { NextRequest, NextResponse } from "next/server";
import { assertCsrf } from "@/lib/http";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * POST/PUT/PATCH/DELETE under `/api/*` must pass `assertCsrf` unless the path is listed here.
 * Add an entry only for unauthenticated flows or endpoints that intentionally run before a CSRF cookie exists.
 */
export const API_CSRF_EXEMPT_PATHS: readonly string[] = [
  "/api/auth/login",
  "/api/auth/password-reset/request",
  "/api/auth/password-reset/confirm",
  "/api/auth/sso/start"
];

export function isUnsafeHttpMethodForCsrf(method: string): boolean {
  return UNSAFE_METHODS.has(method.toUpperCase());
}

export function isApiCsrfExemptPath(pathname: string): boolean {
  return API_CSRF_EXEMPT_PATHS.includes(pathname);
}

/** Cookie-authenticated API mutations: CSRF required unless exempt (see `API_CSRF_EXEMPT_PATHS`). */
export function shouldEnforceApiCsrf(request: Request): boolean {
  let pathname: string;
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    return false;
  }
  if (!pathname.startsWith("/api/")) {
    return false;
  }
  if (!isUnsafeHttpMethodForCsrf(request.method)) {
    return false;
  }
  if (isApiCsrfExemptPath(pathname)) {
    return false;
  }
  return true;
}

export async function maybeBlockApiForMissingCsrf(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api/")) {
    return null;
  }
  if (!isUnsafeHttpMethodForCsrf(request.method)) {
    return null;
  }
  if (isApiCsrfExemptPath(pathname)) {
    return null;
  }
  try {
    await assertCsrf(request);
    return null;
  } catch {
    return errorResponse(ERROR_CODES.AUTH_INVALID_CSRF);
  }
}
