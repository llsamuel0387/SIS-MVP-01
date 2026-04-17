import { NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/api-guard";
import { getEffectivePermissions } from "@/lib/authz";

export async function GET(request: Request) {
  const { user, response } = await guardApiRequest(request);
  if (response || !user) {
    return response;
  }

  return NextResponse.json({
    id: user.id,
    role: user.role,
    studentId: user.studentId,
    staffId: user.staffId,
    staffTier: user.staffTier ?? null,
    permissions: getEffectivePermissions(user)
  });
}
