import { NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/api-guard";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { ROLES } from "@/lib/permissions";
import { listStaffDirectoryMembers } from "@/lib/staff/list-staff-directory-members.service";

export async function GET(request: Request) {
  const { user, response } = await guardApiRequest(request, { roles: [ROLES.staff] });
  if (response || !user) {
    return response;
  }

  const result = await listStaffDirectoryMembers(user);
  if (!result.ok) {
    return errorResponse(result.code);
  }

  return NextResponse.json(result.body);
}
