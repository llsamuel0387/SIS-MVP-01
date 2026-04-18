import { NextResponse } from "next/server";
import { assertCanAccessStudent } from "@/lib/authz";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest, handleAuthzError } from "@/lib/api-guard";
import { getStudentProfileForApi } from "@/lib/students/get-student-profile-for-api.service";

type Context = {
  params: Promise<{ studentId: string }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const { user, response } = await guardApiRequest(request);
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

    const result = await getStudentProfileForApi(studentId);
    if (!result.ok) {
      return errorResponse(result.code);
    }

    return NextResponse.json(result.json);
  } catch (error) {
    console.error("[api/students/[studentId] GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
