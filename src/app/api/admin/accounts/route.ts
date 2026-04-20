import { NextResponse } from "next/server";
import { writeAuditLogForRequest } from "@/lib/audit";
import { PERMISSIONS, type RoleCode } from "@/lib/permissions";
import { userCreateWithProfileSchema } from "@/lib/validation";
import { toUserCreateApiResponseBody } from "@/lib/admin-accounts/create-admin-account.helpers";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest } from "@/lib/api-guard";
import { normalizePageNumber, normalizePageSize } from "@/lib/pagination";
import {
  preflightAndCreateAdminAccountWithPlainPassword
} from "@/lib/admin-accounts/create-admin-account.service";
import { listAdminAccountsForApi } from "@/lib/admin-accounts/admin-accounts-list.service";

export async function GET(request: Request) {
  try {
    const { user: actor, response } = await guardApiRequest(request, { permissions: [PERMISSIONS.userCreate] });
    if (response || !actor) {
      return response;
    }

    const role = new URL(request.url).searchParams.get("role");
    const query = (new URL(request.url).searchParams.get("q") ?? "").trim();
    const suggestMode = new URL(request.url).searchParams.get("suggest") === "1";
    const page = normalizePageNumber(new URL(request.url).searchParams.get("page"));
    const pageSize = normalizePageSize(new URL(request.url).searchParams.get("pageSize"));
    const roles: RoleCode[] =
      role === "STUDENT" || role === "STAFF" || role === "ADMIN" ? [role] : ["STUDENT", "STAFF", "ADMIN"];

    const rows = await listAdminAccountsForApi({ roles, query, suggestMode, page, pageSize });
    return NextResponse.json(rows);
  } catch (error) {
    console.error("[api/admin/accounts GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}

export async function POST(request: Request) {
  const { user: actor, response } = await guardApiRequest(request, {
    permissions: [PERMISSIONS.userCreate]
  });
  if (response || !actor) {
    return response;
  }

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return errorResponse(ERROR_CODES.AUTH_INVALID_PAYLOAD);
  }

  const parsed = userCreateWithProfileSchema.safeParse(jsonBody);
  if (!parsed.success) {
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD, {
      fields: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }
  const body = parsed.data;

  let created;
  try {
    created = await preflightAndCreateAdminAccountWithPlainPassword(body);
  } catch (err) {
    console.error("[api/admin/accounts POST] create failed", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (/PERSON_DATA_KEY_BASE64|PII_INDEX_KEY|PII index key|must decode to 32 bytes/i.test(msg)) {
      return errorResponse(
        ERROR_CODES.SERVER_MISCONFIGURED,
        process.env.NODE_ENV !== "production" ? { reason: msg } : undefined
      );
    }
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }

  if (!created.ok) {
    if (created.errorCode === ERROR_CODES.ACCOUNT_ALREADY_EXISTS) {
      return errorResponse(ERROR_CODES.ACCOUNT_ALREADY_EXISTS);
    }
    if (created.errorCode === ERROR_CODES.ACCOUNT_ROLE_NOT_CONFIGURED) {
      return errorResponse(ERROR_CODES.ACCOUNT_ROLE_NOT_CONFIGURED);
    }
    if (created.errorCode === ERROR_CODES.VALIDATION_SEGMENTATION_INVALID_CHOICE) {
      return errorResponse(ERROR_CODES.VALIDATION_SEGMENTATION_INVALID_CHOICE);
    }
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
  }

  const createdUser = created.user;

  try {
    await writeAuditLogForRequest(request, {
      actorUserId: actor.id,
      action: "user_create",
      targetType: "USER",
      targetId: createdUser.loginId,
      detail: { role: createdUser.role.code }
    });
  } catch (auditError) {
    console.error("[audit] user_create failed after successful account commit", auditError);
  }

  return NextResponse.json(toUserCreateApiResponseBody(createdUser, created.permissions), { status: 201 });
}
