import { prisma } from "@/lib/prisma";

type RateLimitResult = {
  ok: boolean;
  retryAfterMs: number;
};

type RateLimitRow = {
  count: number;
  resetAt: Date;
};

let lastSweepAt = 0;

async function sweepExpiredBuckets(now: Date): Promise<void> {
  if (now.getTime() - lastSweepAt < 5 * 60_000) {
    return;
  }
  lastSweepAt = now.getTime();
  await prisma.rateLimitBucket.deleteMany({
    where: {
      resetAt: {
        lt: new Date(now.getTime() - 24 * 60 * 60_000)
      }
    }
  });
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = new Date();
  const nextResetAt = new Date(now.getTime() + windowMs);

  const rows = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "createdAt", "updatedAt")
    VALUES (${key}, 1, ${nextResetAt}, NOW(), NOW())
    ON CONFLICT ("key") DO UPDATE
    SET "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
        WHEN "RateLimitBucket"."count" < ${limit} THEN "RateLimitBucket"."count" + 1
        ELSE "RateLimitBucket"."count"
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN ${nextResetAt}
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = NOW()
    RETURNING "count", "resetAt"
  `;

  const row = rows[0];
  if (!row) {
    throw new Error("Failed to persist rate limit bucket");
  }

  void sweepExpiredBuckets(now).catch(() => {
    /* best-effort cleanup only */
  });

  if (row.count > limit) {
    return {
      ok: false,
      retryAfterMs: Math.max(0, row.resetAt.getTime() - now.getTime())
    };
  }

  return { ok: true, retryAfterMs: 0 };
}
