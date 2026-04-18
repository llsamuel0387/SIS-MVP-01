import { describe, expect, it } from "vitest";
import {
  mergeStudentSegmentationPatchForAdmin,
  validateStudentSegmentationAgainstConfig,
  type StudentSegmentationConfig
} from "@/lib/student-segmentation";

const sampleConfig: StudentSegmentationConfig = {
  departments: [
    { department: "Secondary", pathways: ["General", "IB"] },
    { department: "Primary", pathways: [] }
  ]
};

describe("validateStudentSegmentationAgainstConfig", () => {
  it("allows both empty", () => {
    expect(validateStudentSegmentationAgainstConfig({}, sampleConfig)).toEqual({ ok: true });
    expect(validateStudentSegmentationAgainstConfig({ department: "", pathway: "" }, sampleConfig)).toEqual({ ok: true });
  });

  it("rejects pathway without department", () => {
    expect(validateStudentSegmentationAgainstConfig({ pathway: "General" }, sampleConfig).ok).toBe(false);
  });

  it("rejects when no departments configured", () => {
    const empty: StudentSegmentationConfig = { departments: [] };
    expect(validateStudentSegmentationAgainstConfig({ department: "X" }, empty).ok).toBe(false);
  });

  it("rejects unknown department", () => {
    expect(validateStudentSegmentationAgainstConfig({ department: "Alien" }, sampleConfig).ok).toBe(false);
  });

  it("allows known department with empty pathway", () => {
    expect(validateStudentSegmentationAgainstConfig({ department: "Secondary" }, sampleConfig)).toEqual({ ok: true });
    expect(validateStudentSegmentationAgainstConfig({ department: "Primary" }, sampleConfig)).toEqual({ ok: true });
  });

  it("allows known pathway for department", () => {
    expect(
      validateStudentSegmentationAgainstConfig({ department: "Secondary", pathway: "IB" }, sampleConfig)
    ).toEqual({ ok: true });
  });

  it("rejects pathway not listed for department", () => {
    expect(
      validateStudentSegmentationAgainstConfig({ department: "Secondary", pathway: "Nope" }, sampleConfig).ok
    ).toBe(false);
  });

  it("rejects non-empty pathway when department has no pathways", () => {
    expect(
      validateStudentSegmentationAgainstConfig({ department: "Primary", pathway: "Anything" }, sampleConfig).ok
    ).toBe(false);
  });
});

describe("mergeStudentSegmentationPatchForAdmin", () => {
  it("merges undefined patch fields from current", () => {
    expect(
      mergeStudentSegmentationPatchForAdmin(
        { department: "Secondary", pathway: "General" },
        { department: "Primary" }
      )
    ).toEqual({ department: "Primary", pathway: "General" });
    expect(
      mergeStudentSegmentationPatchForAdmin(
        { department: "Secondary", pathway: "General" },
        { pathway: "" }
      )
    ).toEqual({ department: "Secondary", pathway: "" });
  });
});
