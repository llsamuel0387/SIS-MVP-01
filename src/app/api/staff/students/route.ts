import { NextResponse } from "next/server";
import { ROLES } from "@/lib/permissions";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest } from "@/lib/api-guard";
import { normalizePageNumber, normalizePageSize } from "@/lib/pagination";
import { listStaffStudentsDirectory } from "@/lib/staff-portal/staff-directory-read.service";

export async function GET(request: Request) {
  try {
    const { user, response } = await guardApiRequest(request, { roles: [ROLES.staff] });
    if (response || !user) {
      return response;
    }

    const url = new URL(request.url);
    const result = await listStaffStudentsDirectory(user, {
      page: normalizePageNumber(url.searchParams.get("page")),
      pageSize: normalizePageSize(url.searchParams.get("pageSize"))
    });
    if (!result.ok) {
      return errorResponse(result.code);
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("[api/staff/students GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
