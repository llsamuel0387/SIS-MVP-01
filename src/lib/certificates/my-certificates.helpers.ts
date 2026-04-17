import crypto from "crypto";
import type { Prisma } from "@prisma/client";

export function newCertificateIssueNo(): string {
  return `ISS-${crypto.randomBytes(10).toString("hex")}`;
}

export function newCertificateVerificationCode(): string {
  return `VER-${crypto.randomBytes(10).toString("hex")}`;
}

export type MyCertificateRow = Prisma.CertificateGetPayload<{
  include: { certificateType: { select: { code: true } } };
}>;

export function toMyCertificateListItem(row: MyCertificateRow) {
  return {
    id: row.id,
    studentId: row.studentId,
    type: row.certificateType.code,
    issuedAt: row.issuedAt.toISOString(),
    purpose: row.purpose,
    issueNo: row.issueNo,
    verificationCode: row.verificationCode
  };
}

export function toMyCertificateIssueResponse(row: MyCertificateRow) {
  return {
    id: row.id,
    studentId: row.studentId,
    type: row.certificateType.code,
    issuedAt: row.issuedAt.toISOString(),
    purpose: row.purpose,
    issueNo: row.issueNo,
    verificationCode: row.verificationCode
  };
}
