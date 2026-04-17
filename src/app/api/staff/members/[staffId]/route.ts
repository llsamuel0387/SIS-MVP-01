import { NextResponse } from "next/server";
import { assertCanAccessStaff } from "@/lib/authz";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest, handleAuthzError } from "@/lib/api-guard";
import { getStaffMemberCardJson } from "@/lib/staff-portal/staff-directory-read.service";

type Context = {
  params: Promise<{ staffId: string }>;
};

export async function GET(request: Request, context: Context) {
  const { user, response } = await guardApiRequest(request);
  if (response || !user) {
    return response;
  }

  const { staffId } = await context.params;

  try {
    assertCanAccessStaff(user, staffId);
  } catch (error) {
    const denied = handleAuthzError(error);
    if (denied) {
      return denied;
    }
    throw error;
  }

  const result = await getStaffMemberCardJson(staffId);
  if (!result.ok) {
    return errorResponse(result.code);
  }

  return NextResponse.json(result.json);
}
