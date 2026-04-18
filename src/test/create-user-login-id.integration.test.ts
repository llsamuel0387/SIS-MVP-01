import { afterAll, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { createUserWithNormalizedLoginId } from "@/lib/create-user-with-login-unique";
import { isLoginIdUniqueConstraintViolation } from "@/lib/prisma-unique-violation";
import { normalizeLoginId } from "@/lib/login-id";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/permissions";

describe("createUserWithNormalizedLoginId + loginId uniqueness (integration DB)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("duplicate User.loginId P2002 is recognized by isLoginIdUniqueConstraintViolation", async () => {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: ROLES.student } });
    const passwordHash = await hashPassword("RaceMetaTest#123456");
    const loginId = `z_p2002_meta_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await prisma.user.create({
      data: {
        loginId,
        passwordHash,
        roleId: role.id,
        status: "ACTIVE",
        mustChangePassword: true
      }
    });

    let caught: unknown;
    try {
      await prisma.user.create({
        data: {
          loginId,
          passwordHash,
          roleId: role.id,
          status: "ACTIVE",
          mustChangePassword: true
        }
      });
    } catch (error) {
      caught = error;
    }

    expect(isLoginIdUniqueConstraintViolation(caught)).toBe(true);
    expect(caught).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect((caught as Prisma.PrismaClientKnownRequestError).code).toBe("P2002");

    await prisma.user.deleteMany({ where: { loginId } });
  });

  it("concurrent creates with same normalized loginId: one success, one login_id_exists; exactly one row", async () => {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: ROLES.student } });
    const passwordHash = await hashPassword("ConcurrentRace#123456");
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const rawA = `  z_race_${suffix}  `;
    const rawB = `Z_RACE_${suffix}`;
    expect(normalizeLoginId(rawA)).toBe(normalizeLoginId(rawB));

    const canonical = normalizeLoginId(rawA);

    const settled = await Promise.allSettled([
      createUserWithNormalizedLoginId({ loginIdFromRequest: rawA, passwordHash, roleId: role.id }),
      createUserWithNormalizedLoginId({ loginIdFromRequest: rawB, passwordHash, roleId: role.id })
    ]);

    const fulfilled = settled.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<
      Awaited<ReturnType<typeof createUserWithNormalizedLoginId>>
    >[];
    const rejected = settled.filter((r) => r.status === "rejected");

    expect(rejected.length, "createUser must not throw; both should fulfill").toBe(0);
    expect(fulfilled.length).toBe(2);

    const outcomes = fulfilled.map((r) => r.value);
    const successes = outcomes.filter((o) => o.ok);
    const exists = outcomes.filter((o) => !o.ok && o.reason === "login_id_exists");

    expect(successes.length, "exactly one create should succeed").toBe(1);
    expect(exists.length, "exactly one create should report login_id_exists").toBe(1);

    const count = await prisma.user.count({ where: { loginId: canonical } });
    expect(count, "DB must contain exactly one user for canonical loginId").toBe(1);

    await prisma.user.deleteMany({ where: { loginId: canonical } });
  });
});
