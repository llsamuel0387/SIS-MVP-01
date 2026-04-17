import { NextResponse } from "next/server";
import { ROLES } from "@/lib/permissions";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest } from "@/lib/api-guard";
import { listStaffStudentsDirectory } from "@/lib/staff-portal/staff-directory-read.service";

export async function GET(request: Request) {
  const { user, response } = await guardApiRequest(request, { roles: [ROLES.staff] });
  if (response || !user) {
    return response;
  }

  const result = await listStaffStudentsDirectory(user);
  if (!result.ok) {
    return errorResponse(result.code);
  }

  return NextResponse.json(result.rows);
}
