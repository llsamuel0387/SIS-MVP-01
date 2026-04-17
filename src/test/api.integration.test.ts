import { afterAll, describe, expect, it } from "vitest";
import { GET as getMe } from "@/app/api/me/route";
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
