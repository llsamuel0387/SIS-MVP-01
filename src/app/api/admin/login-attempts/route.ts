import { NextResponse } from "next/server";
import { getRecentLoginAttempts } from "@/lib/login-attempts";
import { PERMISSIONS } from "@/lib/permissions";
import { guardApiRequest } from "@/lib/api-guard";

export async function GET(request: Request) {
  const { response } = await guardApiRequest(request, { permissions: [PERMISSIONS.auditView] });
  if (response) {
    return response;
  }

  return NextResponse.json(await getRecentLoginAttempts(200));
}
