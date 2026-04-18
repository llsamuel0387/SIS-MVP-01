import { NextResponse } from "next/server";
import { getRecentLoginAttempts } from "@/lib/login-attempts";
import { PERMISSIONS } from "@/lib/permissions";
import { guardApiRequest } from "@/lib/api-guard";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const { response } = await guardApiRequest(request, { permissions: [PERMISSIONS.auditView] });
    if (response) {
      return response;
    }

    return NextResponse.json(await getRecentLoginAttempts(200));
  } catch (error) {
    console.error("[api/admin/login-attempts GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
