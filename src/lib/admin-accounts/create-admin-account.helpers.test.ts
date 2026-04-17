import { describe, expect, it } from "vitest";
import { userCreateWithProfileSchema } from "@/lib/validation";
import {
  buildRequiredPersonSectionWrites,
  mergePersonSectionWrites,
  prepareOptionalProfilePhoto
} from "@/lib/admin-accounts/create-admin-account.helpers";

describe("mergePersonSectionWrites", () => {
  it("returns required only when extensions are undefined", () => {
    const required = [{ personId: "p1", sectionKey: "a", payload: {} }];
    expect(mergePersonSectionWrites(required, undefined)).toEqual(required);
  });

  it("returns required only when extensions are empty", () => {
    const required = [{ personId: "p1", sectionKey: "a", payload: {} }];
    expect(mergePersonSectionWrites(required, [])).toEqual(required);
  });

  it("appends extension writes", () => {
    const required = [{ personId: "p1", sectionKey: "a", payload: { x: 1 } }];
    const ext = [{ personId: "p1", sectionKey: "b", payload: { y: 2 } }];
    expect(mergePersonSectionWrites(required, ext)).toEqual([...required, ...ext]);
  });
});

describe("prepareOptionalProfilePhoto", () => {
  it("treats undefined as absent", async () => {
    expect(await prepareOptionalProfilePhoto(undefined)).toEqual({ kind: "absent" });
  });

  it("treats empty string as absent", async () => {
    expect(await prepareOptionalProfilePhoto("")).toEqual({ kind: "absent" });
  });

  it("rejects non-image base64 without throwing", async () => {
    const junk = Buffer.from("not an image at all").toString("base64").padEnd(40, "A");
    const r = await prepareOptionalProfilePhoto(junk);
    expect(r.kind).toBe("invalid");
  });
});

describe("buildRequiredPersonSectionWrites", () => {
  it("builds identity-only for STAFF", () => {
    const body = userCreateWithProfileSchema.parse({
      loginId: "staff_unit_test",
      password: "UnitTestPassword#9",
      role: "STAFF",
      profile: {
        firstNameKo: "김",
        lastNameKo: "박",
        firstName: "Kim",
        lastName: "Park",
        nationality: "KR",
        dateOfBirth: "1990-05-01",
        email: "kim.park@example.com",
        staffTier: "STAFF"
      }
    });
    if (body.role !== "STAFF") {
      throw new Error("expected STAFF");
    }
    const writes = buildRequiredPersonSectionWrites(body, "person-1");
    expect(writes.map((w) => w.sectionKey)).toEqual(["identity.v1"]);
  });

  it("builds identity, address, segmentation for STUDENT", () => {
    const body = userCreateWithProfileSchema.parse({
      loginId: "stu_unit_test",
      password: "UnitTestPassword#9",
      role: "STUDENT",
      profile: {
        firstNameKo: "이",
        lastNameKo: "최",
        firstName: "Lee",
        lastName: "Choi",
        nationality: "KR",
        dateOfBirth: "2001-03-15",
        email: "lee.choi@example.com",
        termTimeAddress: { country: "KR", addressLine1: "1 Main", postCode: "12345" },
        homeAddress: { country: "KR", addressLine1: "2 Home", postCode: "54321" },
        segmentation: {}
      }
    });
    if (body.role !== "STUDENT") {
      throw new Error("expected STUDENT");
    }
    const writes = buildRequiredPersonSectionWrites(body, "person-2");
    expect(writes.map((w) => w.sectionKey)).toEqual(["identity.v1", "student-address.v1", "student-segmentation.v1"]);
  });
});
