import { PrismaClient } from "@prisma/client";
import { buildAccountSearchText } from "../src/lib/account-search-text";
import { PERMISSIONS, ROLES } from "../src/lib/permissions";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const roleStudent = await prisma.role.upsert({
    where: { code: ROLES.student },
    update: { name: "Student" },
    create: { code: ROLES.student, name: "Student", description: "Student portal user" }
  });
  const roleStaff = await prisma.role.upsert({
    where: { code: ROLES.staff },
    update: { name: "Staff" },
    create: { code: ROLES.staff, name: "Staff", description: "Staff portal user" }
  });
  const roleAdmin = await prisma.role.upsert({
    where: { code: ROLES.admin },
    update: { name: "Admin" },
    create: { code: ROLES.admin, name: "Admin", description: "Admin portal user" }
  });

  const permissionCodes = Object.values(PERMISSIONS);
  for (const code of permissionCodes) {
    await prisma.permission.upsert({
      where: { code },
      update: { name: code },
      create: { code, name: code }
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const studentPermissions = new Set<string>([
    PERMISSIONS.profileViewSelf,
    PERMISSIONS.studentViewSelf,
    PERMISSIONS.certificateIssueSelf,
    PERMISSIONS.certificateViewSelf,
    PERMISSIONS.noticeViewStudent
  ]);
  const staffPermissions = new Set<string>([
    PERMISSIONS.staffViewSelf,
    PERMISSIONS.studentViewAssigned,
    PERMISSIONS.studentStatusUpdateAssigned,
    PERMISSIONS.studentNoteCreate,
    PERMISSIONS.certificateViewAssigned,
    PERMISSIONS.noticeViewStaff
  ]);

  await prisma.rolePermission.deleteMany({});
  for (const permission of allPermissions) {
    if (studentPermissions.has(permission.code)) {
      await prisma.rolePermission.create({
        data: { roleId: roleStudent.id, permissionId: permission.id }
      });
    }
    if (staffPermissions.has(permission.code)) {
      await prisma.rolePermission.create({
        data: { roleId: roleStaff.id, permissionId: permission.id }
      });
    }
    await prisma.rolePermission.create({
      data: { roleId: roleAdmin.id, permissionId: permission.id }
    });
  }

  const adminPasswordHash = await hashPassword("AdminDemo#1");
  const adminUser = await prisma.user.upsert({
    where: { loginId: "admin" },
    update: {
      accountSearchText: buildAccountSearchText({ loginId: "admin", firstNameKo: "관리", lastNameKo: "자", firstNameEn: "Admin", lastNameEn: "User" }),
      passwordHash: adminPasswordHash,
      roleId: roleAdmin.id,
      status: "ACTIVE",
      mustChangePassword: false
    },
    create: {
      loginId: "admin",
      accountSearchText: buildAccountSearchText({ loginId: "admin", firstNameKo: "관리", lastNameKo: "자", firstNameEn: "Admin", lastNameEn: "User" }),
      passwordHash: adminPasswordHash,
      roleId: roleAdmin.id,
      status: "ACTIVE",
      mustChangePassword: false
    }
  });
  await prisma.userProfile.upsert({
    where: { userId: adminUser.id },
    update: {
      firstNameKo: "관리",
      lastNameKo: "자",
      firstNameEn: "Admin",
      lastNameEn: "User",
      email: "admin-seed@demo.invalid",
      termCountry: "KR",
      termAddressLine1: "Demo Campus Admin Office",
      termPostCode: "00001"
    },
    create: {
      userId: adminUser.id,
      firstNameKo: "관리",
      lastNameKo: "자",
      firstNameEn: "Admin",
      lastNameEn: "User",
      email: "admin-seed@demo.invalid",
      termCountry: "KR",
      termAddressLine1: "Demo Campus Admin Office",
      termPostCode: "00001"
    }
  });

  /** 로컬·CI·데모용 학생 (공유·운영 전 비밀번호 변경 권장) */
  const demoStudentPasswordHash = await hashPassword("StudentDemo#1");
  const demoStudentUser = await prisma.user.upsert({
    where: { loginId: "studentdemo" },
    update: {
      accountSearchText: buildAccountSearchText({
        loginId: "studentdemo",
        firstNameKo: "데모",
        lastNameKo: "학생",
        firstNameEn: "Demo",
        lastNameEn: "Student"
      }),
      passwordHash: demoStudentPasswordHash,
      roleId: roleStudent.id,
      status: "ACTIVE",
      mustChangePassword: false
    },
    create: {
      loginId: "studentdemo",
      accountSearchText: buildAccountSearchText({
        loginId: "studentdemo",
        firstNameKo: "데모",
        lastNameKo: "학생",
        firstNameEn: "Demo",
        lastNameEn: "Student"
      }),
      passwordHash: demoStudentPasswordHash,
      roleId: roleStudent.id,
      status: "ACTIVE",
      mustChangePassword: false
    }
  });
  await prisma.student.upsert({
    where: { userId: demoStudentUser.id },
    update: {
      studentNo: "SEED-DEMO-S-001",
      enrollmentStatus: "ENROLLED",
      campus: "International",
      gradeLevel: "10",
      homeroom: "10-A",
      segmentationDepartment: "Secondary",
      segmentationPathway: "General"
    },
    create: {
      userId: demoStudentUser.id,
      studentNo: "SEED-DEMO-S-001",
      enrollmentStatus: "ENROLLED",
      campus: "International",
      gradeLevel: "10",
      homeroom: "10-A",
      segmentationDepartment: "Secondary",
      segmentationPathway: "General"
    }
  });
  await prisma.userProfile.upsert({
    where: { userId: demoStudentUser.id },
    update: {
      firstNameKo: "데모",
      lastNameKo: "학생",
      firstNameEn: "Demo",
      lastNameEn: "Student",
      email: "studentdemo-seed@demo.invalid",
      nationality: "KR",
      termCountry: "KR",
      termAddressLine1: "123 Dormitory Lane",
      termPostCode: "00002",
      homeCountry: "KR",
      homeAddressLine1: "456 Home Street",
      homePostCode: "00003"
    },
    create: {
      userId: demoStudentUser.id,
      firstNameKo: "데모",
      lastNameKo: "학생",
      firstNameEn: "Demo",
      lastNameEn: "Student",
      email: "studentdemo-seed@demo.invalid",
      nationality: "KR",
      termCountry: "KR",
      termAddressLine1: "123 Dormitory Lane",
      termPostCode: "00002",
      homeCountry: "KR",
      homeAddressLine1: "456 Home Street",
      homePostCode: "00003"
    }
  });

  /** 로컬·CI·데모용 교직원 */
  const demoStaffPasswordHash = await hashPassword("StaffDemo#1");
  const demoStaffUser = await prisma.user.upsert({
    where: { loginId: "staffdemo" },
    update: {
      accountSearchText: buildAccountSearchText({
        loginId: "staffdemo",
        firstNameKo: "데모",
        lastNameKo: "교직원",
        firstNameEn: "Demo",
        lastNameEn: "Staff"
      }),
      passwordHash: demoStaffPasswordHash,
      roleId: roleStaff.id,
      status: "ACTIVE",
      mustChangePassword: false
    },
    create: {
      loginId: "staffdemo",
      accountSearchText: buildAccountSearchText({
        loginId: "staffdemo",
        firstNameKo: "데모",
        lastNameKo: "교직원",
        firstNameEn: "Demo",
        lastNameEn: "Staff"
      }),
      passwordHash: demoStaffPasswordHash,
      roleId: roleStaff.id,
      status: "ACTIVE",
      mustChangePassword: false
    }
  });
  await prisma.staff.upsert({
    where: { userId: demoStaffUser.id },
    update: {
      employeeNo: "SEED-DEMO-T-001",
      staffTier: "STAFF",
      employmentStatus: "ACTIVE"
    },
    create: {
      userId: demoStaffUser.id,
      employeeNo: "SEED-DEMO-T-001",
      staffTier: "STAFF",
      employmentStatus: "ACTIVE"
    }
  });
  await prisma.userProfile.upsert({
    where: { userId: demoStaffUser.id },
    update: {
      firstNameKo: "데모",
      lastNameKo: "교직원",
      firstNameEn: "Demo",
      lastNameEn: "Staff",
      email: "staffdemo-seed@demo.invalid",
      termCountry: "KR",
      termAddressLine1: "Faculty Building 2F",
      termPostCode: "00004"
    },
    create: {
      userId: demoStaffUser.id,
      firstNameKo: "데모",
      lastNameKo: "교직원",
      firstNameEn: "Demo",
      lastNameEn: "Staff",
      email: "staffdemo-seed@demo.invalid",
      termCountry: "KR",
      termAddressLine1: "Faculty Building 2F",
      termPostCode: "00004"
    }
  });

  const demoStudentRow = await prisma.student.findUniqueOrThrow({ where: { userId: demoStudentUser.id } });
  const demoStaffRow = await prisma.staff.findUniqueOrThrow({ where: { userId: demoStaffUser.id } });
  const demoAssignmentType = "DEMO_SEED";
  const existingDemoAssignment = await prisma.studentAssignment.findFirst({
    where: {
      staffId: demoStaffRow.id,
      studentId: demoStudentRow.id,
      assignmentType: demoAssignmentType
    }
  });
  if (!existingDemoAssignment) {
    await prisma.studentAssignment.create({
      data: {
        staffId: demoStaffRow.id,
        studentId: demoStudentRow.id,
        assignmentType: demoAssignmentType
      }
    });
  }

  await prisma.identityProviderConfig.upsert({
    where: { provider: "MICROSOFT" },
    update: {},
    create: { provider: "MICROSOFT", enabled: false }
  });

  await prisma.identityProviderConfig.upsert({
    where: { provider: "ONELOGIN" },
    update: {},
    create: { provider: "ONELOGIN", enabled: false }
  });

  await prisma.studentSegmentationConfig.upsert({
    where: { scopeKey: "global" },
    update: {},
    create: {
      scopeKey: "global",
      labelsJson: JSON.stringify({
        department: "Department",
        pathway: "Pathway",
        class: "Class"
      }),
      optionsJson: JSON.stringify({
        department: [],
        pathway: [],
        class: []
      })
    }
  });

  await prisma.certificateType.upsert({
    where: { code: "ENROLLMENT_CERTIFICATE" },
    update: { active: true },
    create: {
      code: "ENROLLMENT_CERTIFICATE",
      name: "Enrollment certificate",
      description: "Student-requested enrollment / attendance certificate",
      active: true
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
