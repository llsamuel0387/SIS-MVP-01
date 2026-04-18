import { NextResponse } from "next/server";
import { listEnabledSsoProviderConfigsForApi } from "@/lib/sso/list-enabled-sso-provider-configs.service";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const rows = await listEnabledSsoProviderConfigsForApi();
    return NextResponse.json(rows);
  } catch (error) {
    console.error("[api/auth/sso/providers GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
