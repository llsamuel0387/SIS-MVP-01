import { NextResponse } from "next/server";
import { ROLES } from "@/lib/permissions";
import { getAuditLogs } from "@/lib/audit";
import { guardApiRequest } from "@/lib/api-guard";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const { response } = await guardApiRequest(request, { roles: [ROLES.admin] });
    if (response) {
      return response;
    }

    return NextResponse.json(await getAuditLogs());
  } catch (error) {
    console.error("[api/admin/audit GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
