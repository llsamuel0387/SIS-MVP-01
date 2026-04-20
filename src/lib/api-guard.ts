import type { NextResponse } from "next/server";
import { ForbiddenError, hasPermission, type SessionUser } from "@/lib/authz";
import { type PermissionCode, type RoleCode } from "@/lib/permissions";
import { getSessionUserFromRequest } from "@/lib/security";
import { assertCsrf } from "@/lib/http";
import { shouldEnforceApiCsrf } from "@/lib/api-csrf-policy";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";

type GuardOptions = {
  roles?: RoleCode[];
  permissions?: PermissionCode[];
};

type GuardResult = { user: SessionUser; response?: never } | { user?: never; response: NextResponse };

/** When `assertCanAccess*` throws {@link ForbiddenError}, return a standard 403 JSON response; otherwise `null`. */
export function handleAuthzError(error: unknown, details?: Record<string, unknown>): NextResponse | null {
  if (error instanceof ForbiddenError) {
    return errorResponse(ERROR_CODES.AUTH_FORBIDDEN, { ...details, reason: error.message });
  }
  return null;
}

export async function guardApiRequest(request: Request, options?: GuardOptions): Promise<GuardResult> {
  let user: SessionUser;
  try {
    user = await getSessionUserFromRequest(request);
  } catch {
    return { response: errorResponse(ERROR_CODES.AUTH_UNAUTHORIZED) };
  }

  if (options?.roles?.length && !options.roles.includes(user.role)) {
    return { response: errorResponse(ERROR_CODES.AUTH_FORBIDDEN) };
  }

  if (options?.permissions?.length && !options.permissions.every((permission) => hasPermission(user, permission))) {
    return { response: errorResponse(ERROR_CODES.AUTH_FORBIDDEN) };
  }

  if (shouldEnforceApiCsrf(request)) {
    try {
      await assertCsrf(request);
    } catch {
      return { response: errorResponse(ERROR_CODES.AUTH_INVALID_CSRF) };
    }
  }

  return { user };
}
