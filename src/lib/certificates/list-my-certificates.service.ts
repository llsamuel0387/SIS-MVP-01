import { prisma } from "@/lib/prisma";
import { toMyCertificateListItem } from "@/lib/certificates/my-certificates.helpers";

export async function listMyCertificates(studentId: string) {
  const rows = await prisma.certificate.findMany({
    where: { studentId },
    orderBy: { issuedAt: "desc" },
    include: { certificateType: { select: { code: true } } }
  });
  return rows.map(toMyCertificateListItem);
}
