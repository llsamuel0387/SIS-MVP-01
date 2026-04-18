import { afterAll, describe, expect, it } from "vitest";
import { GET as getAdminAccounts } from "@/app/api/admin/accounts/route";
import { GET as getMe } from "@/app/api/me/route";
import { GET as getStaffMembers } from "@/app/api/staff/members/route";
import { GET as getStaffStudents } from "@/app/api/staff/students/route";
import { POST as postInformationChangeRequest } from "@/app/api/information-change-requests/route";
import { POST as postPasswordReset } from "@/app/api/auth/password-reset/route";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { INTEGRATION_STUDENT_LOGIN_ID } from "./integration-constants";
import { integrationApiRequest } from "./integration-request";

describe("API handlers (integration DB)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });
  it("GET /api/me returns 401 without session", async () => {
    const res = await getMe(integrationApiRequest("/api/me"));
    expect(res.status).toBe(401);
  });

  it("GET /api/me returns student profile when session is valid", async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { loginId: INTEGRATION_STUDENT_LOGIN_ID },
      include: { student: true }
    });
    const token = await createSession({ userId: user.id });
    const res = await getMe(integrationApiRequest("/api/me", { sessionToken: token }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { role: string; studentId?: string };
    expect(body.role).toBe("STUDENT");
    expect(body.studentId).toBe(user.student?.id);
  });

  it("GET /api/students returns 403 for student role (staff-only surface)", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { loginId: INTEGRATION_STUDENT_LOGIN_ID } });
    const token = await createSession({ userId: user.id });
    const res = await getStaffStudents(integrationApiRequest("/api/staff/students", { sessionToken: token }));
    expect(res.status).toBe(403);
  });

  it("GET /api/admin/accounts returns paginated list payload", async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { loginId: "admin" } });
    const token = await createSession({ userId: admin.id });
    const res = await getAdminAccounts(integrationApiRequest("/api/admin/accounts?page=1&pageSize=1", { sessionToken: token }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      rows: Array<{ id: string; loginId: string; name: string }>;
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(1);
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.totalPages).toBeGreaterThanOrEqual(1);
    expect(body.rows.length).toBe(1);
    expect(body.rows[0]?.id).toBeTruthy();
    expect(body.rows[0]?.loginId).toBeTruthy();
  });

  it("GET /api/staff/students returns paginated payload for staff actor", async () => {
    const staff = await prisma.user.findUniqueOrThrow({ where: { loginId: "staffdemo" } });
    const token = await createSession({ userId: staff.id });
    const res = await getStaffStudents(integrationApiRequest("/api/staff/students?page=1&pageSize=1", { sessionToken: token }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      rows: Array<{ id: string; name: string; studentNo: string }>;
      page: number;
      total: number;
      totalPages: number;
    };
    expect(body.page).toBe(1);
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.totalPages).toBeGreaterThanOrEqual(1);
    expect(body.rows.length).toBe(1);
    expect(body.rows[0]?.studentNo).toBeTruthy();
  });

  it("GET /api/staff/members returns paginated payload for staff actor", async () => {
    const staff = await prisma.user.findUniqueOrThrow({ where: { loginId: "staffdemo" } });
    const token = await createSession({ userId: staff.id });
    const res = await getStaffMembers(integrationApiRequest("/api/staff/members?page=1&pageSize=1", { sessionToken: token }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      rows: Array<{ id: string; name: string; staffNo: string }>;
      page: number;
      total: number;
      totalPages: number;
    };
    expect(body.page).toBe(1);
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.totalPages).toBeGreaterThanOrEqual(1);
    expect(body.rows.length).toBe(1);
    expect(body.rows[0]?.staffNo).toBeTruthy();
  });

  it("POST /api/information-change-requests rejects missing CSRF on mutating request", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { loginId: INTEGRATION_STUDENT_LOGIN_ID } });
    const token = await createSession({ userId: user.id });
    const url = "https://integration.test/api/information-change-requests";
    const bad = new Request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `session_token=${token}; csrf_token=aaa`,
        "x-csrf-token": "bbb"
      },
      body: JSON.stringify({ requesterNote: "Need to update term-time address." })
    });
    const res = await postInformationChangeRequest(bad);
    expect(res.status).toBe(403);
  });

  it("POST /api/information-change-requests creates a row when CSRF and payload are valid", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { loginId: INTEGRATION_STUDENT_LOGIN_ID } });
    const token = await createSession({ userId: user.id });
    const before = await prisma.informationChangeRequest.count({ where: { requesterUserId: user.id } });
    const res = await postInformationChangeRequest(
      integrationApiRequest("/api/information-change-requests", {
        method: "POST",
        sessionToken: token,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterNote: "Integration test: please review my profile." })
      })
    );
    expect(res.status).toBe(200);
    const after = await prisma.informationChangeRequest.count({ where: { requesterUserId: user.id } });
    expect(after).toBe(before + 1);
  });

  it("POST /api/auth/password-reset (self) rejects wrong current password with field error", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { loginId: INTEGRATION_STUDENT_LOGIN_ID } });
    const token = await createSession({ userId: user.id });
    const res = await postPasswordReset(
      integrationApiRequest("/api/auth/password-reset", {
        method: "POST",
        sessionToken: token,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: user.id,
          currentPassword: "definitely-not-the-password",
          newPassword: "TestStudent#999999"
        })
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { details?: { fields?: Array<{ path?: string; message?: string }> } };
    const field = body.details?.fields?.find((f) => f.path === "currentPassword");
    expect(field?.message).toBe("Current password is incorrect.");
  });

  it("POST /api/auth/password-reset (self) keeps current session and revokes others", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { loginId: INTEGRATION_STUDENT_LOGIN_ID } });
    const tokenKeep = await createSession({ userId: user.id });
    const tokenDrop = await createSession({ userId: user.id });

    const res = await postPasswordReset(
      integrationApiRequest("/api/auth/password-reset", {
        method: "POST",
        sessionToken: tokenKeep,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: user.id,
          currentPassword: "TestStudent#1",
          newPassword: "TestStudent#2"
        })
      })
    );
    expect(res.status).toBe(200);

    const still = await getMe(integrationApiRequest("/api/me", { sessionToken: tokenKeep }));
    expect(still.status).toBe(200);

    const gone = await getMe(integrationApiRequest("/api/me", { sessionToken: tokenDrop }));
    expect(gone.status).toBe(401);

    const restore = await postPasswordReset(
      integrationApiRequest("/api/auth/password-reset", {
        method: "POST",
        sessionToken: tokenKeep,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: user.id,
          currentPassword: "TestStudent#2",
          newPassword: "TestStudent#1"
        })
      })
    );
    expect(restore.status).toBe(200);
  });
});
