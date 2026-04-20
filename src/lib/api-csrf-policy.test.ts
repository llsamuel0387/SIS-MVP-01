import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  API_CSRF_EXEMPT_PATHS,
  isApiCsrfExemptPath,
  isUnsafeHttpMethodForCsrf,
  maybeBlockApiForMissingCsrf,
  shouldEnforceApiCsrf
} from "@/lib/api-csrf-policy";

describe("isUnsafeHttpMethodForCsrf", () => {
  it("treats POST, PUT, PATCH, DELETE as unsafe", () => {
    expect(isUnsafeHttpMethodForCsrf("POST")).toBe(true);
    expect(isUnsafeHttpMethodForCsrf("delete")).toBe(true);
    expect(isUnsafeHttpMethodForCsrf("GET")).toBe(false);
    expect(isUnsafeHttpMethodForCsrf("HEAD")).toBe(false);
  });
});

describe("isApiCsrfExemptPath", () => {
  it("lists only known public mutation entrypoints", () => {
    expect(API_CSRF_EXEMPT_PATHS).toContain("/api/auth/login");
    expect(isApiCsrfExemptPath("/api/auth/login")).toBe(true);
    expect(isApiCsrfExemptPath("/api/me")).toBe(false);
  });
});

describe("shouldEnforceApiCsrf", () => {
  it("requires CSRF for protected API mutations", () => {
    const req = new Request("https://example.org/api/me", { method: "POST" });
    expect(shouldEnforceApiCsrf(req)).toBe(true);
  });

  it("skips CSRF for exempt paths", () => {
    const req = new Request("https://example.org/api/auth/login", { method: "POST" });
    expect(shouldEnforceApiCsrf(req)).toBe(false);
  });

  it("skips safe methods", () => {
    const req = new Request("https://example.org/api/me", { method: "GET" });
    expect(shouldEnforceApiCsrf(req)).toBe(false);
  });

  it("ignores non-API paths", () => {
    const req = new Request("https://example.org/other", { method: "POST" });
    expect(shouldEnforceApiCsrf(req)).toBe(false);
  });
});

describe("maybeBlockApiForMissingCsrf", () => {
  const TEST_SECRET = "test-secret-for-csrf-hmac-unit-tests";

  async function computeCsrfToken(sessionToken: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(TEST_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("csrf:" + sessionToken));
    return Buffer.from(sig).toString("hex");
  }

  it("returns 403 when session cookie is absent", async () => {
    const request = new NextRequest("https://example.org/api/me", {
      method: "POST",
      headers: { "x-csrf-token": "aaa" }
    });
    const blocked = await maybeBlockApiForMissingCsrf(request);
    expect(blocked).not.toBeNull();
    expect(blocked?.status).toBe(403);
  });

  it("returns 403 when CSRF header does not match session-derived HMAC", async () => {
    process.env.JWT_ACCESS_SECRET = TEST_SECRET;
    const request = new NextRequest("https://example.org/api/me", {
      method: "POST",
      headers: {
        cookie: "session_token=some-session-token",
        "x-csrf-token": "0".repeat(64)
      }
    });
    const blocked = await maybeBlockApiForMissingCsrf(request);
    expect(blocked).not.toBeNull();
    expect(blocked?.status).toBe(403);
  });

  it("returns null when CSRF header matches session-derived HMAC", async () => {
    process.env.JWT_ACCESS_SECRET = TEST_SECRET;
    const sessionToken = "test-session-token";
    const csrfToken = await computeCsrfToken(sessionToken);

    const request = new NextRequest("https://example.org/api/me", {
      method: "POST",
      headers: {
        cookie: `session_token=${sessionToken}`,
        "x-csrf-token": csrfToken
      }
    });
    const result = await maybeBlockApiForMissingCsrf(request);
    expect(result).toBeNull();
  });
});
