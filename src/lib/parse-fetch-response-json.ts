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
    return {
      ok: false,
      data: badResponsePayload(
        "CLIENT_INVALID_JSON",
        `The server returned a non-JSON response (HTTP ${response.status}). The API may have crashed or returned an HTML error page.`
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
