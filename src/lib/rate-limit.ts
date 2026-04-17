type RateBucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  retryAfterMs: number;
};

const BUCKETS = new Map<string, RateBucket>();
const MAX_BUCKETS = 50_000;
let lastSweepAt = 0;

function sweepExpiredBuckets(now: number): void {
  if (now - lastSweepAt < 60_000) {
    return;
  }
  lastSweepAt = now;
  for (const [key, bucket] of BUCKETS.entries()) {
    if (now > bucket.resetAt) {
      BUCKETS.delete(key);
    }
  }
}

function enforceMaxBuckets(now: number): void {
  if (BUCKETS.size <= MAX_BUCKETS) {
    return;
  }
  // Best-effort pressure relief: drop oldest-expiring buckets first.
  const candidates = Array.from(BUCKETS.entries()).sort((a, b) => a[1].resetAt - b[1].resetAt);
  const removeCount = BUCKETS.size - MAX_BUCKETS;
  for (let index = 0; index < removeCount; index += 1) {
    const entry = candidates[index];
    if (!entry) {
      break;
    }
    BUCKETS.delete(entry[0]);
  }
  // If still over capacity (extreme race), force-clear stale entries.
  if (BUCKETS.size > MAX_BUCKETS) {
    sweepExpiredBuckets(now);
  }
}

function consumeInMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweepExpiredBuckets(now);
  const bucket = BUCKETS.get(key);

  if (!bucket || now > bucket.resetAt) {
    enforceMaxBuckets(now);
    BUCKETS.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return { ok: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  return consumeInMemoryRateLimit(key, limit, windowMs);
}
