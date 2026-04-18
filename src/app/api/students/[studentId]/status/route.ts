import { NextResponse } from "next/server";
import { assertCanAccessStudent } from "@/lib/authz";
import { statusChangeSchema } from "@/lib/validation";
import { writeAuditLogForRequest } from "@/lib/audit";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest, handleAuthzError } from "@/lib/api-guard";
import { patchStudentEnrollmentStatus } from "@/lib/students/patch-student-enrollment-status.service";

type Context = {
  params: Promise<{ studentId: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const { user: actor, response } = await guardApiRequest(request);
    if (response || !actor) {
      return response;
    }

    const { studentId } = await context.params;

    try {
      assertCanAccessStudent(actor, studentId);
    } catch (error) {
      const denied = handleAuthzError(error);
      if (denied) {
        return denied;
      }
      throw error;
    }

    let body: { newStatus: "ENROLLED" | "LEAVE_OF_ABSENCE" | "WITHDRAWN" | "GRADUATED"; reason: string };
    try {
      body = statusChangeSchema.parse(await request.json());
    } catch {
      return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
    }

    const result = await patchStudentEnrollmentStatus({
      actor,
      studentId,
      newStatus: body.newStatus,
      reason: body.reason
    });
    if (!result.ok) {
      return errorResponse(result.code);
    }

    await writeAuditLogForRequest(request, {
      actorUserId: actor.id,
      action: "student_status_change",
      targetType: "STUDENT",
      targetId: studentId,
      detail: { oldStatus: result.body.oldStatus, newStatus: result.body.newStatus, reason: body.reason }
    });

    return NextResponse.json(result.body);
  } catch (error) {
    console.error("[api/students/[studentId]/status PATCH]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
