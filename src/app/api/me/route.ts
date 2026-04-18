import { NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/api-guard";
import { getEffectivePermissions } from "@/lib/authz";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
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
  } catch (error) {
    console.error("[api/me GET]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
