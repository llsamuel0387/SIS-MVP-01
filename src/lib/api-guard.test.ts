import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES, PERMISSIONS } from "@/lib/permissions";
import type { SessionUser } from "@/lib/authz";

const getSessionUserFromRequest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/security", () => ({
  getSessionUserFromRequest
}));

import { ForbiddenError } from "@/lib/authz";
import { guardApiRequest, handleAuthzError } from "@/lib/api-guard";

const TEST_JWT_SECRET = "test-csrf-guard-secret-for-unit-tests";
const TEST_SESSION_TOKEN = "test-session-token-for-guard-tests";

async function requestWithCsrf(url: string, init: RequestInit = {}): Promise<Request> {
  process.env.JWT_ACCESS_SECRET = TEST_JWT_SECRET;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(TEST_JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("csrf:" + TEST_SESSION_TOKEN));
  const csrfToken = Buffer.from(sig).toString("hex");
  const headers = new Headers(init.headers);
  headers.set("x-csrf-token", csrfToken);
  headers.set("cookie", `session_token=${TEST_SESSION_TOKEN}`);
  return new Request(url, { ...init, headers });
}

describe("handleAuthzError", () => {
  it("returns 403 JSON for ForbiddenError", () => {
    const res = handleAuthzError(new ForbiddenError("Forbidden: student access denied"));
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
  });

  it("returns null for other errors", () => {
    expect(handleAuthzError(new Error("boom"))).toBeNull();
  });
});

describe("guardApiRequest", () => {
  const studentUser: SessionUser = { id: "u1", role: ROLES.student, studentId: "s1" };

  beforeEach(() => {
    getSessionUserFromRequest.mockReset();
  });

  it("returns 401 when session resolution fails", async () => {
    getSessionUserFromRequest.mockRejectedValue(new Error("no session"));
    const res = await guardApiRequest(new Request("https://x/api/me"));
    expect("response" in res && res.response).toBeTruthy();
    if ("response" in res && res.response) {
      expect(res.response.status).toBe(401);
    }
  });

  it("returns 403 when role is not allowed", async () => {
    getSessionUserFromRequest.mockResolvedValue(studentUser);
    const res = await guardApiRequest(await requestWithCsrf("https://x/api/admin/audit", { method: "POST" }), {
      roles: [ROLES.admin]
    });
    expect("response" in res && res.response?.status).toBe(403);
  });

  it("returns 403 when a required permission is missing", async () => {
    getSessionUserFromRequest.mockResolvedValue(studentUser);
    const res = await guardApiRequest(await requestWithCsrf("https://x/api/users", { method: "POST" }), {
      permissions: [PERMISSIONS.userCreate]
    });
    expect("response" in res && res.response?.status).toBe(403);
  });

  it("returns 403 on mutating API requests without valid CSRF", async () => {
    getSessionUserFromRequest.mockResolvedValue(studentUser);
    const bad = new Request("https://x/api/information-change-requests", {
      method: "POST",
      headers: { cookie: "session_token=some-session", "x-csrf-token": "0".repeat(64) }
    });
    const res = await guardApiRequest(bad, { roles: [ROLES.student] });
    expect("response" in res && res.response?.status).toBe(403);
  });

  it("returns user when role, permission, and CSRF are satisfied", async () => {
    const admin: SessionUser = {
      id: "adm",
      role: ROLES.admin,
      permissions: [PERMISSIONS.userCreate, PERMISSIONS.userUpdate]
    };
    getSessionUserFromRequest.mockResolvedValue(admin);
    const res = await guardApiRequest(await requestWithCsrf("https://x/api/users", { method: "POST" }), {
      permissions: [PERMISSIONS.userCreate]
    });
    expect("user" in res && res.user?.id).toBe("adm");
  });
});
