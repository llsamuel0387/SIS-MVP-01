import { describe, expect, it } from "vitest";
import {
  assertCanAccessStaff,
  assertCanAccessStudent,
  ForbiddenError,
  getEffectivePermissions,
  hasPermission
} from "@/lib/authz";
import { PERMISSIONS, ROLES, STAFF_TIERS } from "@/lib/permissions";

describe("getEffectivePermissions", () => {
  it("merges staff tier grants onto base role permissions", () => {
    const perms = getEffectivePermissions({
      id: "u1",
      role: ROLES.staff,
      staffId: "s1",
      staffTier: STAFF_TIERS.viceHeadmaster
    });
    expect(perms).toContain(PERMISSIONS.studentSegmentationManage);
    expect(perms).toContain(PERMISSIONS.studentViewAssigned);
  });
});

describe("hasPermission", () => {
  it("returns false when explicit permission list omits the code", () => {
    const user = {
      id: "u1",
      role: ROLES.staff,
      staffId: "s1",
      permissions: [PERMISSIONS.staffViewSelf, PERMISSIONS.studentViewAssigned]
    };
    expect(hasPermission(user, PERMISSIONS.studentViewAll)).toBe(false);
    expect(hasPermission(user, PERMISSIONS.studentViewAssigned)).toBe(true);
  });
});

describe("assertCanAccessStudent", () => {
  it("allows a student to access only their own student record id", () => {
    const user = { id: "u1", role: ROLES.student, studentId: "stu-1" };
    expect(() => assertCanAccessStudent(user, "stu-1")).not.toThrow();
    expect(() => assertCanAccessStudent(user, "stu-2")).toThrow(ForbiddenError);
  });

  it("allows staff with assignment + studentViewAssigned", () => {
    const user = {
      id: "u1",
      role: ROLES.staff,
      staffId: "stf-1",
      permissions: [PERMISSIONS.staffViewSelf, PERMISSIONS.studentViewAssigned],
      assignedStudentIds: ["stu-a", "stu-b"]
    };
    expect(() => assertCanAccessStudent(user, "stu-a")).not.toThrow();
    expect(() => assertCanAccessStudent(user, "stu-x")).toThrow(ForbiddenError);
  });

  it("allows admin with studentViewAll", () => {
    const user = {
      id: "adm",
      role: ROLES.admin,
      permissions: [PERMISSIONS.studentViewAll, PERMISSIONS.userCreate]
    };
    expect(() => assertCanAccessStudent(user, "any-student")).not.toThrow();
  });
});

describe("assertCanAccessStaff", () => {
  it("allows staff to read only their own staff record when they have staffViewSelf", () => {
    const user = {
      id: "u1",
      role: ROLES.staff,
      staffId: "stf-9",
      permissions: [PERMISSIONS.staffViewSelf, PERMISSIONS.studentViewAssigned]
    };
    expect(() => assertCanAccessStaff(user, "stf-9")).not.toThrow();
    expect(() => assertCanAccessStaff(user, "stf-other")).toThrow(ForbiddenError);
  });
});
