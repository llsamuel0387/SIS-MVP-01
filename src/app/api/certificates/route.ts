import { NextResponse } from "next/server";
import { assertCanIssueEnrollmentCertificate } from "@/lib/authz";
import { certificateIssueSchema } from "@/lib/validation";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest, handleAuthzError } from "@/lib/api-guard";
import { writeAuditLogForRequest } from "@/lib/audit";

export async function POST(request: Request) {
  const { user, response } = await guardApiRequest(request);
  if (response || !user) {
    return response;
  }

  let body: { studentId: string; certificateType?: string; purpose?: string };
  try {
    body = certificateIssueSchema.parse(await request.json());
  } catch {
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
  }

  try {
    assertCanIssueEnrollmentCertificate(user, body.studentId);
  } catch (error) {
    const denied = handleAuthzError(error);
    if (denied) {
      return denied;
    }
    throw error;
  }

  await writeAuditLogForRequest(request, {
    actorUserId: user.id,
    action: "certificate_issue",
    targetType: "CERTIFICATE",
    targetId: body.studentId,
    detail: {
      certificateType: body.certificateType ?? "ENROLLMENT_CERTIFICATE",
      purpose: body.purpose ?? "General",
      scope: "staff_or_admin"
    }
  });

  return NextResponse.json({
    certificateType: body.certificateType ?? "ENROLLMENT_CERTIFICATE",
    studentId: body.studentId,
    purpose: body.purpose ?? "General",
    verificationCode: "VER-2026-0001",
    issueNo: "ISS-2026-0001",
    status: "issued"
  });
}
