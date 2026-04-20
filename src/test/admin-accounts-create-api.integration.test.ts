import { afterAll, describe, expect, it } from "vitest";
import { POST as postAdminAccounts } from "@/app/api/admin/accounts/route";
import { ERROR_CODES } from "@/lib/api-error";
import { normalizeLoginId } from "@/lib/login-id";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { integrationApiRequest } from "./integration-request";

/** Mirrors `ERROR_MESSAGES[ACCOUNT_ALREADY_EXISTS].message` in `src/lib/api-error.ts` (contract for UI). */
const ACCOUNT_ALREADY_EXISTS_MESSAGE = "This login ID already exists.";

type ErrorEnvelope = {
  ok: false;
  error: { code: string; message: string };
  details?: unknown;
};

function assertAccountAlreadyExistsResponse(res: Response, body: unknown): asserts body is ErrorEnvelope {
  expect(res.status, "HTTP status for duplicate loginId").toBe(409);
  expect(body).toMatchObject({
    ok: false,
    error: {
      code: ERROR_CODES.ACCOUNT_ALREADY_EXISTS,
      message: ACCOUNT_ALREADY_EXISTS_MESSAGE
    }
  });
  const b = body as ErrorEnvelope;
  expect(b.details).toBeUndefined();
}

async function adminActorSessionToken(): Promise<string> {
  const admin = await prisma.user.findUniqueOrThrow({
    where: { loginId: "admin" },
    include: { role: true }
  });
  expect(admin.role.code).toBe("ADMIN");
  return createSession({ userId: admin.id });
}

async function adminCreateRequest(loginId: string, sessionToken: string) {
  return integrationApiRequest("/api/admin/accounts", {
    method: "POST",
    sessionToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      loginId,
      password: "ApiContractTest#12",
      role: "ADMIN"
    })
  });
}

async function adminPostJson(sessionToken: string, body: unknown) {
  return integrationApiRequest("/api/admin/accounts", {
    method: "POST",
    sessionToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

/** 1×1 PNG (valid for `sanitizeImageUploadBase64`). */
const ONE_BY_ONE_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function minimalStudentPayload(loginId: string, profileOverrides?: Record<string, unknown>) {
  const safeEmailLocal = loginId.replace(/[^a-z0-9]/gi, "").slice(0, 40);
  return {
    loginId,
    password: "ApiContractTest#12",
    role: "STUDENT" as const,
    profile: {
      firstNameKo: "이",
      lastNameKo: "최",
      firstName: "Lee",
      lastName: "Choi",
      nationality: "KR",
      dateOfBirth: "2001-03-15",
      email: `${safeEmailLocal}@example.com`,
      termTimeAddress: { country: "KR", addressLine1: "1 Main St", postCode: "12345" },
      homeAddress: { country: "KR", addressLine1: "2 Home Ave", postCode: "54321" },
      segmentation: {},
      ...profileOverrides
    }
  };
}

function minimalStaffPayload(loginId: string, profileOverrides?: Record<string, unknown>) {
  const safeEmailLocal = loginId.replace(/[^a-z0-9]/gi, "").slice(0, 40);
  return {
    loginId,
    password: "ApiContractTest#12",
    role: "STAFF" as const,
    profile: {
      firstNameKo: "김",
      lastNameKo: "박",
      firstName: "Kim",
      lastName: "Park",
      nationality: "KR",
      dateOfBirth: "1990-05-01",
      email: `${safeEmailLocal}@example.com`,
      staffTier: "STAFF" as const,
      ...profileOverrides
    }
  };
}

describe("POST /api/admin/accounts — HTTP contract (integration)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("duplicate create: second request is 409 with standard error envelope and ACCOUNT_ALREADY_EXISTS", async () => {
    const token = await adminActorSessionToken();
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const loginId = `z_http_dup_${suffix}`;

    const first = await postAdminAccounts(await adminCreateRequest(loginId, token));
    expect(first.status).toBe(201);
    const created = (await first.json()) as { loginId: string; id: string };
    expect(created.loginId).toBe(loginId);

    const second = await postAdminAccounts(await adminCreateRequest(loginId, token));
    const errBody = await second.json();
    assertAccountAlreadyExistsResponse(second, errBody);

    await prisma.user.delete({ where: { id: created.id } });
  });

  it("normalization across API: spaced/cased first, plain second → 201 then 409; stored loginId is normalized", async () => {
    const token = await adminActorSessionToken();
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const firstLogin = `  Z_NORM_API_${suffix}  `;
    const secondLogin = `z_norm_api_${suffix}`;
    expect(normalizeLoginId(firstLogin)).toBe(normalizeLoginId(secondLogin));

    const r1 = await postAdminAccounts(await adminCreateRequest(firstLogin, token));
    expect(r1.status).toBe(201);
    const created = (await r1.json()) as { loginId: string; id: string };
    expect(created.loginId).toBe(normalizeLoginId(firstLogin));

    const r2 = await postAdminAccounts(await adminCreateRequest(secondLogin, token));
    const errBody = await r2.json();
    assertAccountAlreadyExistsResponse(r2, errBody);

    await prisma.user.delete({ where: { id: created.id } });
  });

  it("concurrent POSTs with same normalized loginId: statuses {201,409}, one row, error code on 409", async () => {
    const token = await adminActorSessionToken();
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    const rawA = `z_race_api_${suffix}`;
    const rawB = `Z_RACE_API_${suffix}`;
    const canonical = normalizeLoginId(rawA);
    expect(normalizeLoginId(rawB)).toBe(canonical);

    const [reqA, reqB] = await Promise.all([adminCreateRequest(rawA, token), adminCreateRequest(rawB, token)]);
    const settled = await Promise.allSettled([postAdminAccounts(reqA), postAdminAccounts(reqB)]);

    const fulfilled = settled.filter((s) => s.status === "fulfilled") as PromiseFulfilledResult<Response>[];
    expect(fulfilled.length, "handlers must not throw").toBe(2);

    const statuses = fulfilled.map((f) => f.value.status).sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);

    const byStatus = new Map(fulfilled.map((f) => [f.value.status, f.value] as const));
    const res409 = byStatus.get(409)!;
    const errJson = await res409.json();
    assertAccountAlreadyExistsResponse(res409, errJson);

    const count = await prisma.user.count({ where: { loginId: canonical } });
    expect(count).toBe(1);

    const user = await prisma.user.findFirstOrThrow({ where: { loginId: canonical } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it("STUDENT without photo: 201 and core rows exist", async () => {
    const token = await adminActorSessionToken();
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const loginId = `z_stu_np_${suffix}`;
    const res = await postAdminAccounts(await adminPostJson(token, minimalStudentPayload(loginId)));
    expect(res.status).toBe(201);
    const created = (await res.json()) as { id: string };
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: created.id },
      include: { profile: true, student: true, person: { include: { sections: true } } }
    });
    expect(user.student).not.toBeNull();
    expect(user.profile).not.toBeNull();
    expect(user.person?.type).toBe("STUDENT");
    const photoSection = user.person?.sections.find((s) => s.sectionKey === "photo.v1");
    expect(photoSection).toBeUndefined();
    await prisma.user.delete({ where: { id: created.id } });
  });

  it("STAFF without photo: 201 and staff row exists", async () => {
    const token = await adminActorSessionToken();
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const loginId = `z_stf_np_${suffix}`;
    const res = await postAdminAccounts(await adminPostJson(token, minimalStaffPayload(loginId)));
    expect(res.status).toBe(201);
    const created = (await res.json()) as { id: string };
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: created.id },
      include: { staff: true, person: true }
    });
    expect(user.staff).not.toBeNull();
    expect(user.person?.type).toBe("STAFF");
    await prisma.user.delete({ where: { id: created.id } });
  });

  it("STUDENT with valid tiny PNG: 201 and photo section stored", async () => {
    const token = await adminActorSessionToken();
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const loginId = `z_stu_ph_${suffix}`;
    const res = await postAdminAccounts(
      await adminPostJson(token, minimalStudentPayload(loginId, { photoPngBase64: ONE_BY_ONE_PNG_B64 }))
    );
    expect(res.status).toBe(201);
    const created = (await res.json()) as { id: string };
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: created.id },
      include: { person: { include: { sections: true } } }
    });
    expect(user.person?.sections.some((s) => s.sectionKey === "photo.v1")).toBe(true);
    await prisma.user.delete({ where: { id: created.id } });
  });

  it("STUDENT with invalid photo base64: 400 and no user row", async () => {
    const token = await adminActorSessionToken();
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const loginId = `z_stu_badph_${suffix}`;
    const junkB64 = Buffer.from("not a png or jpeg payload x".repeat(20)).toString("base64");
    const res = await postAdminAccounts(
      await adminPostJson(token, minimalStudentPayload(loginId, { photoPngBase64: junkB64 }))
    );
    expect(res.status).toBe(400);
    const row = await prisma.user.findUnique({ where: { loginId } });
    expect(row).toBeNull();
  });
});
