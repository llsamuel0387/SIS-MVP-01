import { NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/api-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { listAdminInformationChangeRequests } from "@/lib/information-change-requests/list-admin-information-change-requests.service";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const { response } = await guardApiRequest(request, {
      permissions: [PERMISSIONS.userUpdate]
    });
    if (response) {
      return response;
    }

    const items = await listAdminInformationChangeRequests();
    return NextResponse.json(items);
  } catch (error) {
    console.error("[api/admin/information-change-requests GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
