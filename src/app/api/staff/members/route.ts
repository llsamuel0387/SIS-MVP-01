import { NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/api-guard";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { normalizePageNumber, normalizePageSize } from "@/lib/pagination";
import { ROLES } from "@/lib/permissions";
import { listStaffDirectoryMembers } from "@/lib/staff/list-staff-directory-members.service";

export async function GET(request: Request) {
  try {
    const { user, response } = await guardApiRequest(request, { roles: [ROLES.staff] });
    if (response || !user) {
      return response;
    }

    const url = new URL(request.url);
    const result = await listStaffDirectoryMembers(user, {
      page: normalizePageNumber(url.searchParams.get("page")),
      pageSize: normalizePageSize(url.searchParams.get("pageSize"))
    });
    if (!result.ok) {
      return errorResponse(result.code);
    }

    return NextResponse.json(result.body);
  } catch (error) {
    console.error("[api/staff/members GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
