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
    acc[key] = decodeURIComponent(rest.join("=").trim());
    return acc;
  }, {});
}

export function assertCsrf(request: Request, csrfCookieName = "csrf_token"): void {
  const csrfHeader = request.headers.get("x-csrf-token");
  const csrfCookie = parseCookies(request)[csrfCookieName];

  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    throw new Error("Invalid CSRF token");
  }
}

export function createCsrfToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
