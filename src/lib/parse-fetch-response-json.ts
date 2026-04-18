import { secureClientFetch } from "@/lib/browser-security";
import { ERROR_CODES } from "@/lib/api-error";

/**
 * Read `fetch` Response body as JSON without throwing.
 * Empty or non-JSON bodies become `{ ok: false, error: { code, message } }`-shaped payloads
 * so callers can use {@link getUiErrorMessage} instead of crashing the UI.
 */
export async function parseFetchResponseJson<T>(response: Response): Promise<{ ok: boolean; data: T }> {
  const raw = await response.text();
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      ok: false,
      data: badResponsePayload(
        "CLIENT_EMPTY_RESPONSE",
        `The server returned an empty body (HTTP ${response.status}). Check the terminal running Next.js or try npm run dev:clean.`
      ) as T
    };
  }
  try {
    const data = JSON.parse(trimmed) as T;
    return { ok: response.ok, data };
  } catch {
    const serverErrorHint =
      response.status >= 500
        ? " The dev server may have returned an HTML error page instead of JSON—check the Next.js terminal, or run npm run dev:clean and npm run dev."
        : "";
    return {
      ok: false,
      data: badResponsePayload(
        "CLIENT_INVALID_JSON",
        `The server returned a non-JSON body (HTTP ${response.status}).${serverErrorHint}`
      ) as T
    };
  }
}

function badResponsePayload(code: string, message: string) {
  return {
    ok: false as const,
    error: {
      code,
      message
    }
  };
}

// Exponential backoff: 200ms, 400ms, 800ms, 1600ms, 3200ms → covers on-demand route compilation (~1–5s)
function devFetchRetryDelayMs(attemptIndex: number): number {
  return 200 * Math.pow(2, attemptIndex);
}

function isTransientDevServerHtmlFailure(response: Response, parsed: { data: unknown }): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  const code = (parsed.data as { error?: { code?: string } } | undefined)?.error?.code;
  return (
    !response.ok &&
    response.status >= 500 &&
    (code === "CLIENT_INVALID_JSON" || code === "CLIENT_EMPTY_RESPONSE")
  );
}

/**
 * Browser `fetch` + JSON body parse, safe for UI: network failures and non-JSON bodies never throw.
 * In dev, retries with exponential backoff when the server returns HTML 500 — next dev compiles routes
 * on first request, so the first hit of an uncompiled route can take 1–5s to recover.
 */
export async function secureFetchJson<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T }> {
  const maxAttempts = process.env.NODE_ENV === "production" ? 1 : 6;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await secureClientFetch(url, init);
      const parsed = await parseFetchResponseJson<T>(response);

      if (isTransientDevServerHtmlFailure(response, parsed) && attempt < maxAttempts - 1) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, devFetchRetryDelayMs(attempt));
        });
        continue;
      }

      return parsed;
    } catch {
      if (attempt === maxAttempts - 1) {
        return {
          ok: false,
          data: badResponsePayload(
            ERROR_CODES.CLIENT_FETCH_FAILED,
            "Could not complete the request. Check your network and try again."
          ) as T
        };
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, devFetchRetryDelayMs(attempt));
      });
    }
  }

  return {
    ok: false,
    data: badResponsePayload(
      ERROR_CODES.CLIENT_FETCH_FAILED,
      "Could not complete the request. Check your network and try again."
    ) as T
  };
}
