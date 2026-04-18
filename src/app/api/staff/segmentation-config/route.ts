import { NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/api-guard";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { ROLES } from "@/lib/permissions";
import { studentSegmentationConfigSchema } from "@/lib/validation";
import { writeAuditLogForRequest } from "@/lib/audit";
import {
  getStaffSegmentationConfigForApi,
  putStaffSegmentationConfigForApi
} from "@/lib/staff/segmentation-config.service";

export async function GET(request: Request) {
  try {
    const { user, response } = await guardApiRequest(request, {
      roles: [ROLES.staff, ROLES.admin]
    });
    if (response || !user) {
      return response;
    }

    const config = await getStaffSegmentationConfigForApi();
    return NextResponse.json(config);
  } catch (error) {
    console.error("[api/staff/segmentation-config GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}

export async function PUT(request: Request) {
  const { user, response } = await guardApiRequest(request, {
    roles: [ROLES.staff, ROLES.admin]
  });
  if (response || !user) {
    return response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(ERROR_CODES.AUTH_INVALID_PAYLOAD);
  }

  const parsed = studentSegmentationConfigSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
  }

  const result = await putStaffSegmentationConfigForApi({ actor: user, config: parsed.data });
  if (!result.ok) {
    if (result.details) {
      return errorResponse(result.code, result.details);
    }
    return errorResponse(result.code);
  }

  await writeAuditLogForRequest(request, {
    actorUserId: user.id,
    action: "student_segmentation_update",
    targetType: "STUDENT_SEGMENTATION_CONFIG",
    targetId: "global",
    detail: {}
  });

  return NextResponse.json({ ok: true, config: result.config });
}
