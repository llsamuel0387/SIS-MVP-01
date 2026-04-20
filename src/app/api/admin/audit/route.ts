import { NextResponse } from "next/server";
import { ROLES } from "@/lib/permissions";
import { getAuditLogsPaginated } from "@/lib/audit";
import type { AuditAction } from "@/lib/audit";
import { guardApiRequest } from "@/lib/api-guard";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const { response } = await guardApiRequest(request, { roles: [ROLES.admin] });
    if (response) return response;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") ?? "50", 10);
    const action = (url.searchParams.get("action") ?? "") as AuditAction | "";

    const dateFromParam = url.searchParams.get("dateFrom");
    const dateToParam = url.searchParams.get("dateTo");
    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
    const dateTo = dateToParam ? new Date(dateToParam) : undefined;
    const loginId = url.searchParams.get("loginId") ?? undefined;

    return NextResponse.json(
      await getAuditLogsPaginated({ page, pageSize, action: action || undefined, dateFrom, dateTo, loginId })
    );
  } catch (error) {
    console.error("[api/admin/audit GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
