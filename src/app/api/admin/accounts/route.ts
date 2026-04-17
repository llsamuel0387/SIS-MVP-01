import { NextResponse } from "next/server";
import { writeAuditLogForRequest } from "@/lib/audit";
import { PERMISSIONS, type RoleCode } from "@/lib/permissions";
import { userCreateWithProfileSchema } from "@/lib/validation";
import { toUserCreateApiResponseBody } from "@/lib/admin-accounts/create-admin-account.helpers";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest } from "@/lib/api-guard";
import {
  preflightAndCreateAdminAccountWithPlainPassword
} from "@/lib/admin-accounts/create-admin-account.service";
import { listAdminAccountsForApi } from "@/lib/admin-accounts/admin-accounts-list.service";

export async function GET(request: Request) {
  const { user: actor, response } = await guardApiRequest(request, { permissions: [PERMISSIONS.userCreate] });
  if (response || !actor) {
    return response;
  }

  const role = new URL(request.url).searchParams.get("role");
  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();
  const suggestMode = new URL(request.url).searchParams.get("suggest") === "1";
  const roles: RoleCode[] =
    role === "STUDENT" || role === "STAFF" || role === "ADMIN" ? [role] : ["STUDENT", "STAFF", "ADMIN"];

  const rows = await listAdminAccountsForApi({ roles, query, suggestMode });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { user: actor, response } = await guardApiRequest(request, {
    permissions: [PERMISSIONS.userCreate]
  });
  if (response || !actor) {
    return response;
  }

  const parsed = userCreateWithProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD, {
      fields: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }
  const body = parsed.data;

  const created = await preflightAndCreateAdminAccountWithPlainPassword(body);

  if (!created.ok) {
    if (created.errorCode === ERROR_CODES.ACCOUNT_ALREADY_EXISTS) {
      return errorResponse(ERROR_CODES.ACCOUNT_ALREADY_EXISTS);
    }
    if (created.errorCode === ERROR_CODES.ACCOUNT_ROLE_NOT_CONFIGURED) {
      return errorResponse(ERROR_CODES.ACCOUNT_ROLE_NOT_CONFIGURED);
    }
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
  }

  const createdUser = created.user;

  try {
    await writeAuditLogForRequest(request, {
      actorUserId: actor.id,
      action: "user_create",
      targetType: "USER",
      targetId: createdUser.id,
      detail: { loginId: createdUser.loginId, role: createdUser.role.code }
    });
  } catch (auditError) {
    console.error("[audit] user_create failed after successful account commit", auditError);
  }

  return NextResponse.json(toUserCreateApiResponseBody(createdUser, created.permissions), { status: 201 });
}
