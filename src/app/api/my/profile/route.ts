import { NextResponse } from "next/server";
import { ROLES } from "@/lib/permissions";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest } from "@/lib/api-guard";
import { getStudentMyProfileJson } from "@/lib/student-portal/get-my-profile.service";

export async function GET(request: Request) {
  const { user, response } = await guardApiRequest(request, { roles: [ROLES.student] });
  if (response || !user) {
    return response;
  }

  const result = await getStudentMyProfileJson(user.id);
  if (!result.ok) {
    return errorResponse(result.code);
  }

  return NextResponse.json(result.json, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
