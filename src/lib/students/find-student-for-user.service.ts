import { prisma } from "@/lib/prisma";

export async function findStudentIdByUserId(userId: string): Promise<string | null> {
  const row = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
  return row?.id ?? null;
}
