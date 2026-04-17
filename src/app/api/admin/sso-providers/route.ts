import { NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/permissions";
import { guardApiRequest } from "@/lib/api-guard";
import { listAdminSsoProviderConfigsForApi } from "@/lib/sso/list-admin-sso-provider-configs.service";

export async function GET(request: Request) {
  const { response } = await guardApiRequest(request, { permissions: [PERMISSIONS.permissionManage] });
  if (response) {
    return response;
  }

  const payload = await listAdminSsoProviderConfigsForApi();
  return NextResponse.json(payload);
}
