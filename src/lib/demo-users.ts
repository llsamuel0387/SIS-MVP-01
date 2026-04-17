import { ROLES } from "@/lib/permissions";
import type { SessionUser } from "@/lib/authz";

type DemoUserRecord = SessionUser & {
  loginId: string;
  passwordHash: string;
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
};

const DEMO_USERS: DemoUserRecord[] = [
  {
    id: "user-student-1",
    loginId: "student1",
    passwordHash: "$2b$12$O/Av81ZheNcjlohcZCAp1OrxNgfVRWX4bIaLC6fYiGq4AIQvE3NC6",
    role: ROLES.student,
    studentId: "student-1",
    status: "ACTIVE"
  },
  {
    id: "user-teacher-1",
    loginId: "teacher1",
    passwordHash: "$2b$12$kwjaZvgxJE2sdQqJ9gG3Q..jL3GG3enIaHE1I7HEJwkFqSZ.z4Iu.",
    role: ROLES.staff,
    staffId: "teacher-1",
    assignedStudentIds: ["student-1", "student-2"],
    status: "ACTIVE"
  },
  {
    id: "user-admin-1",
    loginId: "admin1",
    passwordHash: "$2b$12$YghPFaD1TrFg0mCZAxXhzOS1X7POlAmBLAYA7IEWEq7DGtNBRcxM2",
    role: ROLES.admin,
    status: "ACTIVE"
  }
];

export function findDemoUserByLoginId(loginId: string): DemoUserRecord | undefined {
  return DEMO_USERS.find((user) => user.loginId === loginId);
}

export function findDemoUserById(userId: string): DemoUserRecord | undefined {
  return DEMO_USERS.find((user) => user.id === userId);
}

export function toSessionUser(user: DemoUserRecord): SessionUser {
  return {
    id: user.id,
    role: user.role,
    studentId: user.studentId,
    staffId: user.staffId,
    assignedStudentIds: user.assignedStudentIds,
    permissions: user.permissions
  };
}

export function sanitizeUserResponse(user: DemoUserRecord) {
  return {
    id: user.id,
    loginId: user.loginId,
    role: user.role,
    studentId: user.studentId,
    staffId: user.staffId,
    status: user.status
  };
}
