import { NextResponse } from "next/server";
import { ROLES } from "@/lib/permissions";
import { getAuditLogs } from "@/lib/audit";
import { guardApiRequest } from "@/lib/api-guard";

export async function GET(request: Request) {
  const { response } = await guardApiRequest(request, { roles: [ROLES.admin] });
  if (response) {
    return response;
  }

  return NextResponse.json(await getAuditLogs());
}
