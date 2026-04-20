type IntegrationInit = RequestInit & { sessionToken?: string };

async function computeCsrfTokenForSession(sessionToken: string): Promise<string> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET not set in integration test environment");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("csrf:" + sessionToken));
  return Buffer.from(sig).toString("hex");
}

/**
 * Build a `Request` for App Router handlers with session + CSRF cookies (guard + `shouldEnforceApiCsrf`).
 */
export async function integrationApiRequest(pathname: string, init?: IntegrationInit): Promise<Request> {
  const i = init ?? {};
  const url = `https://integration.test${pathname}`;
  const method = (i.method ?? "GET").toUpperCase();
  const headers = new Headers(i.headers);

  if (i.sessionToken) {
    let cookie = `session_token=${i.sessionToken}`;
    if (method !== "GET" && method !== "HEAD") {
      const csrfToken = await computeCsrfTokenForSession(i.sessionToken);
      headers.set("x-csrf-token", csrfToken);
    }
    const prevCookie = headers.get("cookie");
    headers.set("cookie", [prevCookie, cookie].filter(Boolean).join("; "));
  }

  const { sessionToken: _st, ...rest } = i;
  return new Request(url, { ...rest, headers });
}
