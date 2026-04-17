import { NextResponse } from "next/server";
import { ROLES } from "@/lib/permissions";
import { assertCanAccessStudent } from "@/lib/authz";
import { errorResponse } from "@/lib/api-error";
import { guardApiRequest, handleAuthzError } from "@/lib/api-guard";
import { getStaffStudentDetailJson } from "@/lib/staff-portal/staff-directory-read.service";

type Context = {
  params: Promise<{ studentId: string }>;
};

export async function GET(request: Request, context: Context) {
  const { user, response } = await guardApiRequest(request, { roles: [ROLES.staff] });
  if (response || !user) {
    return response;
  }

  const { studentId } = await context.params;

  try {
    assertCanAccessStudent(user, studentId);
  } catch (error) {
    const denied = handleAuthzError(error);
    if (denied) {
      return denied;
    }
    throw error;
  }

  const result = await getStaffStudentDetailJson(studentId);
  if (!result.ok) {
    return errorResponse(result.code);
  }

  return NextResponse.json(result.json);
}
