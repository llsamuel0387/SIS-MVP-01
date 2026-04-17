import { PrismaClient } from "@prisma/client";
import { INTEGRATION_STUDENT_LOGIN_ID } from "../src/test/integration-constants";
import { ROLES } from "../src/lib/permissions";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const roleStudent = await prisma.role.findUniqueOrThrow({ where: { code: ROLES.student } });
  await prisma.user.deleteMany({ where: { loginId: INTEGRATION_STUDENT_LOGIN_ID } });

  const passwordHash = await hashPassword("TestStudent#1");
  await prisma.user.create({
    data: {
      loginId: INTEGRATION_STUDENT_LOGIN_ID,
      passwordHash,
      roleId: roleStudent.id,
      status: "ACTIVE",
      mustChangePassword: false,
      student: {
        create: {
          studentNo: "INT-TEST-001",
          enrollmentStatus: "ENROLLED"
        }
      }
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
