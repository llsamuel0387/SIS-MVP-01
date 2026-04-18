import { describe, expect, it } from "vitest";
import { loginSchema, sanitizeText, studentSegmentationPatchSchema } from "@/lib/validation";

describe("sanitizeText", () => {
  it("strips angle brackets and trims", () => {
    expect(sanitizeText("  a<b>c  ")).toBe("abc");
  });
});

describe("studentSegmentationPatchSchema", () => {
  it("preserves empty strings so PATCH can clear department/pathway", () => {
    const out = studentSegmentationPatchSchema.parse({ department: "", pathway: "" });
    expect(out.department).toBe("");
    expect(out.pathway).toBe("");
  });

  it("still accepts omitted keys as undefined", () => {
    const out = studentSegmentationPatchSchema.parse({});
    expect(out.department).toBeUndefined();
    expect(out.pathway).toBeUndefined();
  });
});

describe("loginSchema", () => {
  it("rejects loginId shorter than 3 characters", () => {
    expect(() => loginSchema.parse({ loginId: "ab", password: "x" })).toThrow();
  });

  it("accepts minimal valid payload and normalizes loginId", () => {
    const out = loginSchema.parse({ loginId: "  u<<>>ser  ", password: "any" });
    expect(out.loginId).toBe("user");
    expect(out.password).toBe("any");
  });
});
