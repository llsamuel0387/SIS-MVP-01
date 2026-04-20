import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { passwordResetSchema } from "@/lib/validation";
import { writeAuditLogForRequest } from "@/lib/audit";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest } from "@/lib/api-guard";
import { getSessionTokenFromRequest } from "@/lib/security";
import { resetUserPassword } from "@/lib/auth/reset-user-password.service";

export async function POST(request: Request) {
  const { user: actor, response } = await guardApiRequest(request);
  if (response || !actor) {
    return response;
  }

  let body: { targetUserId: string; newPassword: string; currentPassword?: string };
  try {
    body = passwordResetSchema.parse(await request.json());
  } catch {
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
  }

  const result = await resetUserPassword({
    actorUserId: actor.id,
    actorHasUserResetPasswordPermission: hasPermission(actor, PERMISSIONS.userResetPassword),
    targetUserId: body.targetUserId,
    newPassword: body.newPassword,
    currentPassword: body.currentPassword,
    sessionToken: getSessionTokenFromRequest(request)
  });

  if (!result.ok) {
    if (result.fields) {
      return errorResponse(result.code, { fields: result.fields });
    }
    return errorResponse(result.code);
  }

  await writeAuditLogForRequest(request, {
    actorUserId: actor.id,
    action: "password_reset",
    targetType: "USER",
    targetId: result.data.targetLoginId
  });

  return NextResponse.json({
    ok: true,
    message: "Password reset accepted."
  });
}
