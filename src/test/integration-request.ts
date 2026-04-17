type IntegrationInit = RequestInit & { sessionToken?: string; csrfToken?: string };

/**
 * Build a `Request` for App Router handlers with session + CSRF cookies (guard + `shouldEnforceApiCsrf`).
 */
export function integrationApiRequest(pathname: string, init?: IntegrationInit): Request {
  const i = init ?? {};
  const url = `https://integration.test${pathname}`;
  const method = (i.method ?? "GET").toUpperCase();
  const csrf = i.csrfToken ?? "csrf-integration";
  const headers = new Headers(i.headers);

  if (i.sessionToken) {
    const cookie = [`session_token=${i.sessionToken}`, `csrf_token=${csrf}`].join("; ");
    headers.set("cookie", [headers.get("cookie"), cookie].filter(Boolean).join("; "));
    if (method !== "GET" && method !== "HEAD") {
      headers.set("x-csrf-token", csrf);
    }
  }

  const { sessionToken: _st, csrfToken: _ct, ...rest } = i;

  return new Request(url, { ...rest, headers });
}
