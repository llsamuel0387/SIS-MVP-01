import { NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/api-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { informationChangeRequestDecisionSchema } from "@/lib/validation";
import { writeAuditLogForRequest } from "@/lib/audit";
import { patchInformationChangeRequestDecision } from "@/lib/information-change-requests/patch-information-change-request.service";

type Context = {
  params: Promise<{ requestId: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const { user, response } = await guardApiRequest(request, {
    permissions: [PERMISSIONS.userUpdate]
  });
  if (response || !user) {
    return response;
  }

  const { requestId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(ERROR_CODES.AUTH_INVALID_PAYLOAD);
  }

  const parsed = informationChangeRequestDecisionSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
  }

  const result = await patchInformationChangeRequestDecision({
    requestId,
    decision: parsed.data.decision,
    reviewerNote: parsed.data.reviewerNote ?? null,
    reviewerUserId: user.id
  });

  if (!result.ok) {
    return errorResponse(result.code);
  }

  await writeAuditLogForRequest(request, {
    actorUserId: user.id,
    action: result.data.audit.action,
    targetType: "INFORMATION_CHANGE_REQUEST",
    targetId: result.data.audit.targetId,
    detail: result.data.audit.detail
  });

  return NextResponse.json({ ok: true, status: result.data.status });
}
