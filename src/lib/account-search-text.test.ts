import { describe, expect, it } from "vitest";
import { buildAccountSearchText, normalizeAccountSearchQuery } from "@/lib/account-search-text";

describe("normalizeAccountSearchQuery", () => {
  it("normalizes case and repeated whitespace", () => {
    expect(normalizeAccountSearchQuery("  Demo   Student  ")).toBe("demo student");
  });
});

describe("buildAccountSearchText", () => {
  it("includes login id plus Korean and English variants", () => {
    const text = buildAccountSearchText({
      loginId: "  StudentDemo  ",
      firstNameKo: "데모",
      lastNameKo: "학생",
      firstNameEn: "Demo",
      middleNameEn: "A",
      lastNameEn: "Student"
    });

    expect(text).toContain("studentdemo");
    expect(text).toContain("학생데모");
    expect(text).toContain("학생 데모");
    expect(text).toContain("demo a student");
    expect(text).toContain("student demo a");
  });
});
