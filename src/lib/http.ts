function decodeCookieValue(raw: string): string | null {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
    const [rawKey, ...rest] = pair.split("=");
    const key = rawKey?.trim();
    if (!key) {
      return acc;
    }
    const decodedValue = decodeCookieValue(rest.join("=").trim());
    if (decodedValue === null) {
      return acc;
    }
    acc[key] = decodedValue;
    return acc;
  }, {});
}

// CSRF tokens are HMAC-SHA256(sessionToken, JWT_ACCESS_SECRET) so a stolen token
// cannot be replayed against a different session — the server re-derives the expected
// value from the session cookie rather than comparing header to cookie.

const SESSION_COOKIE_NAME_FOR_CSRF = "session_token";

async function getCsrfHmacKey(): Promise<CryptoKey> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured");
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify"
  ]);
}

export async function createCsrfToken(sessionToken: string): Promise<string> {
  const key = await getCsrfHmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("csrf:" + sessionToken));
  return Buffer.from(sig).toString("hex");
}

export async function assertCsrf(request: Request): Promise<void> {
  const csrfHeader = request.headers.get("x-csrf-token");
  const sessionToken = parseCookies(request)[SESSION_COOKIE_NAME_FOR_CSRF];

  if (!csrfHeader || !sessionToken) {
    throw new Error("Invalid CSRF token");
  }

  // Convert header hex to bytes — Buffer.from returns empty buffer for invalid hex,
  // so a length check catches malformed values before reaching verify().
  const headerBytes = Buffer.from(csrfHeader, "hex");
  if (headerBytes.length !== 32) {
    throw new Error("Invalid CSRF token");
  }

  const key = await getCsrfHmacKey();
  const valid = await crypto.subtle.verify("HMAC", key, headerBytes, new TextEncoder().encode("csrf:" + sessionToken));
  if (!valid) {
    throw new Error("Invalid CSRF token");
  }
}
