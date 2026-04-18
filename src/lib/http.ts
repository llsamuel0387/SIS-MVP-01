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
