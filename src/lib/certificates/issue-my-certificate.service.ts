import { prisma } from "@/lib/prisma";
import { ERROR_CODES } from "@/lib/api-error";
import {
  newCertificateIssueNo,
  newCertificateVerificationCode,
  toMyCertificateIssueResponse
} from "@/lib/certificates/my-certificates.helpers";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type IssueMyCertificateInput = {
  studentId: string;
  requestedByUserId: string;
  certificateTypeCode: string;
  purpose: string;
};

export async function issueMyCertificate(input: IssueMyCertificateInput) {
  const certType = await prisma.certificateType.findFirst({
    where: { code: input.certificateTypeCode, active: true }
  });
  if (!certType) {
    return { ok: false as const, code: ERROR_CODES.VALIDATION_INVALID_PAYLOAD as ErrorCode };
  }

  const created = await prisma.certificate.create({
    data: {
      certificateTypeId: certType.id,
      studentId: input.studentId,
      requestedByUserId: input.requestedByUserId,
      issuedByUserId: null,
      purpose: input.purpose,
      issueNo: newCertificateIssueNo(),
      verificationCode: newCertificateVerificationCode()
    },
    include: { certificateType: { select: { code: true } } }
  });

  return { ok: true as const, body: toMyCertificateIssueResponse(created), certificateId: created.id };
}
