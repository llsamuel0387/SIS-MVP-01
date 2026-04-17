import type { SessionUser } from "@/lib/authz";

const TTL_MS = 300_000;

type CacheEntry = {
  expiresAt: number;
  user: SessionUser | null;
};

const byTokenHash = new Map<string, CacheEntry>();
const tokenHashesByUserId = new Map<string, Set<string>>();

function removeUserIndex(tokenHash: string, user: SessionUser | null): void {
  if (!user) {
    return;
  }
  const set = tokenHashesByUserId.get(user.id);
  if (!set) {
    return;
  }
  set.delete(tokenHash);
  if (set.size === 0) {
    tokenHashesByUserId.delete(user.id);
  }
}

function clearTokenHash(tokenHash: string): void {
  const entry = byTokenHash.get(tokenHash);
  if (!entry) {
    return;
  }
  removeUserIndex(tokenHash, entry.user);
  byTokenHash.delete(tokenHash);
}

/** `undefined` = cache miss; `null` = cached invalid session; otherwise cloned {@link SessionUser}. */
export function getCachedSessionUser(tokenHash: string): SessionUser | null | undefined {
  const entry = byTokenHash.get(tokenHash);
  if (!entry) {
    return undefined;
  }
  if (Date.now() > entry.expiresAt) {
    clearTokenHash(tokenHash);
    return undefined;
  }
  if (entry.user === null) {
    return null;
  }
  return structuredClone(entry.user);
}

export function setCachedSessionUser(tokenHash: string, user: SessionUser | null): void {
  if (byTokenHash.has(tokenHash)) {
    clearTokenHash(tokenHash);
  }
  const expiresAt = Date.now() + TTL_MS;
  byTokenHash.set(tokenHash, {
    expiresAt,
    user: user === null ? null : structuredClone(user)
  });
  if (user) {
    let set = tokenHashesByUserId.get(user.id);
    if (!set) {
      set = new Set();
      tokenHashesByUserId.set(user.id, set);
    }
    set.add(tokenHash);
  }
}

export function invalidateSessionCacheByTokenHash(tokenHash: string): void {
  clearTokenHash(tokenHash);
}

export function invalidateSessionCacheByUserId(userId: string): void {
  const set = tokenHashesByUserId.get(userId);
  if (!set) {
    return;
  }
  for (const tokenHash of set) {
    byTokenHash.delete(tokenHash);
  }
  tokenHashesByUserId.delete(userId);
}
