import { prisma } from "@/lib/prisma";

export function normalizeLoginId(loginId: string): string {
  return loginId.trim().toLowerCase();
}

export async function findUserIdByLoginIdInsensitive(loginId: string): Promise<string | null> {
  const normalized = normalizeLoginId(loginId);
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "User"
    WHERE lower("loginId") = ${normalized}
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}
