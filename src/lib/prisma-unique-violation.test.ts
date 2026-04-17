import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import {
  isLoginIdUniqueConstraintViolation,
  isUniqueConstraintOnFields
} from "@/lib/prisma-unique-violation";

function p2002(meta: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta
  });
}

describe("isLoginIdUniqueConstraintViolation", () => {
  it("returns true for P2002 with sole target loginId (array)", () => {
    expect(isLoginIdUniqueConstraintViolation(p2002({ target: ["loginId"] }))).toBe(true);
  });

  it("returns true for P2002 with string target loginId", () => {
    expect(isLoginIdUniqueConstraintViolation(p2002({ target: "loginId" }))).toBe(true);
  });

  it("returns false when P2002 targets a different sole field", () => {
    expect(isLoginIdUniqueConstraintViolation(p2002({ target: ["email"] }))).toBe(false);
  });

  it("returns false for P2002 composite target that includes loginId (must not map to ACCOUNT_ALREADY_EXISTS)", () => {
    expect(isLoginIdUniqueConstraintViolation(p2002({ target: ["loginId", "roleId"] }))).toBe(false);
  });

  it("returns false when target is empty array", () => {
    expect(isLoginIdUniqueConstraintViolation(p2002({ target: [] }))).toBe(false);
  });

  it("returns false for non-P2002 errors", () => {
    expect(
      isLoginIdUniqueConstraintViolation(
        new Prisma.PrismaClientKnownRequestError("Not found", {
          code: "P2025",
          clientVersion: "test"
        })
      )
    ).toBe(false);
  });

  it("returns false for arbitrary Error", () => {
    expect(isLoginIdUniqueConstraintViolation(new Error("boom"))).toBe(false);
  });
});

describe("isUniqueConstraintOnFields (generic)", () => {
  it("returns true when P2002 targets include loginId (array target)", () => {
    expect(isUniqueConstraintOnFields(p2002({ target: ["loginId"] }), ["loginId"])).toBe(true);
  });

  it("returns false for other fields", () => {
    expect(isUniqueConstraintOnFields(p2002({ target: ["email"] }), ["loginId"])).toBe(false);
  });
});
