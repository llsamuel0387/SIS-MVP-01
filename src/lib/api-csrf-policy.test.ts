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
  it("returns 403 response when CSRF header and cookie mismatch", () => {
    const url = "https://example.org/api/me";
    const request = new NextRequest(url, {
      method: "POST",
      headers: {
        cookie: "csrf_token=aaa",
        "x-csrf-token": "bbb"
      }
    });
    const blocked = maybeBlockApiForMissingCsrf(request);
    expect(blocked).not.toBeNull();
    expect(blocked?.status).toBe(403);
  });

  it("returns null when token matches", () => {
    const token = "samevalue";
    const url = "https://example.org/api/me";
    const request = new NextRequest(url, {
      method: "POST",
      headers: {
        cookie: `csrf_token=${token}`,
        "x-csrf-token": token
      }
    });
    expect(maybeBlockApiForMissingCsrf(request)).toBeNull();
  });
});
