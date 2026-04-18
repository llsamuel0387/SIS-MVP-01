import { NextResponse } from "next/server";
import { PERMISSIONS, type RoleCode } from "@/lib/permissions";
import { userCreateWithProfileSchema, usersPickerRoleHeaderSchema } from "@/lib/validation";
import { writeAuditLogForRequest } from "@/lib/audit";
import { toUserCreateApiResponseBody } from "@/lib/admin-accounts/create-admin-account.helpers";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest } from "@/lib/api-guard";
import { preflightAndCreateAdminAccountWithPlainPassword } from "@/lib/admin-accounts/create-admin-account.service";
import { listUsersForPicker } from "@/lib/users/users-list.service";

export async function GET(request: Request) {
  try {
    const { response } = await guardApiRequest(request, { permissions: [PERMISSIONS.userCreate] });
    if (response) {
      return response;
    }

    const rawHeader = request.headers.get("x-role-filter");
    let roles: RoleCode[];
    if (!rawHeader?.trim()) {
      roles = ["STUDENT", "STAFF"];
    } else {
      const parsed = usersPickerRoleHeaderSchema.safeParse(rawHeader.trim());
      if (!parsed.success) {
        return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
      }
      roles = [parsed.data];
    }

    const result = await listUsersForPicker(roles);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/users GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}

export async function POST(request: Request) {
  try {
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
      return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
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

    const created = await preflightAndCreateAdminAccountWithPlainPassword(body);

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

    await writeAuditLogForRequest(request, {
      actorUserId: actor.id,
      action: "user_create",
      targetType: "USER",
      targetId: createdUser.id,
      detail: {
        loginId: createdUser.loginId,
        role: createdUser.role.code,
        passwordHashLength: created.passwordHashLength
      }
    });

    return NextResponse.json(toUserCreateApiResponseBody(createdUser, created.permissions), { status: 201 });
  } catch (error) {
    console.error("[api/users POST]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
