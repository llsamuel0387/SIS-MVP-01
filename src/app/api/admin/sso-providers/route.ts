import { NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/permissions";
import { guardApiRequest } from "@/lib/api-guard";
import { listAdminSsoProviderConfigsForApi } from "@/lib/sso/list-admin-sso-provider-configs.service";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const { response } = await guardApiRequest(request, { permissions: [PERMISSIONS.permissionManage] });
    if (response) {
      return response;
    }

    const payload = await listAdminSsoProviderConfigsForApi();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[api/admin/sso-providers GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
