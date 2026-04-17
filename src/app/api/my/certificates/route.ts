import { NextResponse } from "next/server";
import { ROLES } from "@/lib/permissions";
import { assertCanIssueEnrollmentCertificate } from "@/lib/authz";
import { certificateIssueSchema } from "@/lib/validation";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest, handleAuthzError } from "@/lib/api-guard";
import { writeAuditLogForRequest } from "@/lib/audit";
import { listMyCertificates } from "@/lib/certificates/list-my-certificates.service";
import { issueMyCertificate } from "@/lib/certificates/issue-my-certificate.service";

export async function GET(request: Request) {
  const { user, response } = await guardApiRequest(request, { roles: [ROLES.student] });
  if (response || !user) {
    return response;
  }
  if (!user.studentId) {
    return errorResponse(ERROR_CODES.AUTH_FORBIDDEN);
  }

  const items = await listMyCertificates(user.studentId);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const { user, response } = await guardApiRequest(request, {
    roles: [ROLES.student]
  });
  if (response || !user) {
    return response;
  }
  if (!user.studentId) {
    return errorResponse(ERROR_CODES.AUTH_FORBIDDEN);
  }

  let body: { certificateType?: string; purpose?: string };
  try {
    body = certificateIssueSchema.omit({ studentId: true }).parse(await request.json());
  } catch {
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
  }

  try {
    assertCanIssueEnrollmentCertificate(user, user.studentId);
  } catch (error) {
    const denied = handleAuthzError(error);
    if (denied) {
      return denied;
    }
    throw error;
  }

  const typeCode = body.certificateType ?? "ENROLLMENT_CERTIFICATE";
  const purpose = body.purpose?.trim() || "General";

  const issued = await issueMyCertificate({
    studentId: user.studentId,
    requestedByUserId: user.id,
    certificateTypeCode: typeCode,
    purpose
  });
  if (!issued.ok) {
    return errorResponse(issued.code);
  }

  await writeAuditLogForRequest(request, {
    actorUserId: user.id,
    action: "certificate_issue",
    targetType: "CERTIFICATE",
    targetId: issued.certificateId,
    detail: { certificateType: issued.body.type, studentId: issued.body.studentId, scope: "self" }
  });

  return NextResponse.json(issued.body, { status: 201 });
}
