import { prisma } from "@/lib/prisma";

type LoginAttempt = {
  key: string;
  success: boolean;
  ipAddress: string;
  createdAt: string;
};

export async function recordLoginAttempt(input: Omit<LoginAttempt, "createdAt"> & { userId?: string; reasonCode?: string }): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      userId: input.userId,
      loginId: input.key,
      success: input.success,
      ipAddress: input.ipAddress,
      reasonCode: input.reasonCode
    }
  });
}

export async function getRecentLoginAttempts(limit = 100): Promise<LoginAttempt[]> {
  const rows = await prisma.loginAttempt.findMany({
    orderBy: { createdAt: "desc" },
    take: limit
  });
  return rows.map((row) => ({
    key: row.loginId,
    success: row.success,
    ipAddress: row.ipAddress ?? "unknown",
    createdAt: row.createdAt.toISOString()
  }));
}
