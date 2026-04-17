import { NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/api-guard";
import { ROLES } from "@/lib/permissions";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { informationChangeRequestCreateSchema } from "@/lib/validation";
import type { InformationChangeDraft } from "@/lib/information-change-request";
import { writeAuditLogForRequest } from "@/lib/audit";
import { listMyInformationChangeRequests } from "@/lib/information-change-requests/list-my-information-change-requests.service";
import { createMyInformationChangeRequest } from "@/lib/information-change-requests/create-my-information-change-request.service";
import { findStudentIdByUserId } from "@/lib/students/find-student-for-user.service";

export async function GET(request: Request) {
  const { user, response } = await guardApiRequest(request, { roles: [ROLES.student] });
  if (response || !user) {
    return response;
  }

  const items = await listMyInformationChangeRequests(user.id);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const { user, response } = await guardApiRequest(request, {
    roles: [ROLES.student]
  });
  if (response || !user) {
    return response;
  }

  if (!(await findStudentIdByUserId(user.id))) {
    return errorResponse(ERROR_CODES.RESOURCE_STUDENT_NOT_FOUND);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(ERROR_CODES.AUTH_INVALID_PAYLOAD);
  }

  const parsed = informationChangeRequestCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
  }

  const created = await createMyInformationChangeRequest({
    userId: user.id,
    draft: parsed.data as InformationChangeDraft
  });
  if (!created.ok) {
    return errorResponse(created.code);
  }

  const row = created.data.row;
  await writeAuditLogForRequest(request, {
    actorUserId: user.id,
    action: "information_change_request_create",
    targetType: "INFORMATION_CHANGE_REQUEST",
    targetId: row.id,
    detail: {
      targetUserId: user.id,
      hasEmail: Boolean(row.requestedEmail),
      hasTermAddress: Boolean(row.requestedTermAddressLine1),
      hasHomeAddress: Boolean(row.requestedHomeAddressLine1)
    }
  });

  return NextResponse.json({
    ok: true,
    request: created.data.request
  });
}
