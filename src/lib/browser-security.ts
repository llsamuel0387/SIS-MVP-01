export function readCookie(name: string): string {
  if (typeof document === "undefined") {
    return "";
  }
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1] ?? ""
  );
}

export async function secureClientFetch(url: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers ?? {});

  if (method !== "GET" && method !== "HEAD" && !headers.has("x-csrf-token")) {
    headers.set("x-csrf-token", readCookie("csrf_token"));
  }

  return await fetch(url, {
    ...init,
    credentials: "include",
    headers
  });
}
