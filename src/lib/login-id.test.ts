import { describe, expect, it } from "vitest";
import { normalizeLoginId } from "@/lib/login-id";

describe("normalizeLoginId", () => {
  it("trims and lowercases", () => {
    expect(normalizeLoginId("  TestUser  ")).toBe("testuser");
  });

  it("maps casing variants to the same canonical id string", () => {
    expect(normalizeLoginId("TESTUSER")).toBe("testuser");
    expect(normalizeLoginId("testuser")).toBe("testuser");
    expect(normalizeLoginId("TeStUsEr")).toBe("testuser");
  });

  it("aligns mixed casing to one key for duplicate semantics", () => {
    expect(normalizeLoginId("ABC")).toBe(normalizeLoginId("abc"));
  });
});
