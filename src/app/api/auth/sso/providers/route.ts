import { NextResponse } from "next/server";
import { listEnabledSsoProviderConfigsForApi } from "@/lib/sso/list-enabled-sso-provider-configs.service";

export async function GET() {
  const rows = await listEnabledSsoProviderConfigsForApi();
  return NextResponse.json(rows);
}
