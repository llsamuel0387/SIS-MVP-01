import { NextResponse } from "next/server";
import { writeAuditLogForRequest } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest } from "@/lib/api-guard";
import { adminAccountUserPatchBodySchema } from "@/lib/admin-accounts/patch-admin-account.schema";
import {
  deleteAdminAccountUser,
  getAdminAccountUserDetail,
  patchAdminAccountUser
} from "@/lib/admin-accounts/admin-account-user.service";

type Context = {
  params: Promise<{ userId: string }>;
};

export async function GET(_request: Request, context: Context) {
  try {
    const { response } = await guardApiRequest(_request, { permissions: [PERMISSIONS.userCreate] });
    if (response) {
      return response;
    }

    const { userId } = await context.params;
    const result = await getAdminAccountUserDetail(userId);
    if (!result.ok) {
      return errorResponse(result.code);
    }
    return NextResponse.json(result.json);
  } catch (error) {
    console.error("[api/admin/accounts/[userId] GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}

export async function PATCH(request: Request, context: Context) {
  const { user: actor, response } = await guardApiRequest(request, {
    permissions: [PERMISSIONS.userDisable]
  });
  if (response || !actor) {
    return response;
  }

  const { userId } = await context.params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
  }

  const parsed = adminAccountUserPatchBodySchema.safeParse(raw);
  if (!parsed.success) {
    const emptyPatch = parsed.error.issues.some((i) => i.message === "empty_patch");
    if (emptyPatch) {
      return errorResponse(ERROR_CODES.ACCOUNT_INVALID_STATUS);
    }
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
  }

  const result = await patchAdminAccountUser(actor, userId, parsed.data);
  if (!result.ok) {
    return errorResponse(result.code);
  }

  await writeAuditLogForRequest(request, {
    actorUserId: actor.id,
    action: result.data.audit.action,
    targetType: "USER",
    targetId: (result.data.audit.detail.loginId as string) ?? userId,
    detail: result.data.audit.detail
  });

  return NextResponse.json(result.data.json);
}

export async function DELETE(request: Request, context: Context) {
  try {
    const { user: actor, response } = await guardApiRequest(request, {
      permissions: [PERMISSIONS.userDisable]
    });
    if (response || !actor) {
      return response;
    }

    const { userId } = await context.params;
    const result = await deleteAdminAccountUser(actor, userId);
    if (!result.ok) {
      return errorResponse(result.code);
    }

    await writeAuditLogForRequest(request, {
      actorUserId: actor.id,
      action: result.data.audit.action,
      targetType: "USER",
      targetId: (result.data.audit.detail.loginId as string) ?? userId,
      detail: result.data.audit.detail
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/accounts/[userId] DELETE]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
