import { NextResponse } from "next/server";
import type { RoleCode } from "@/lib/permissions";
import type { SessionUser } from "@/lib/authz";
import { getSessionUserFromRequest } from "@/lib/security";

export async function requireAuth(
  request: Request
): Promise<{ user?: SessionUser; error?: NextResponse }> {
  try {
    const user = await getSessionUserFromRequest(request);
    return { user };
  } catch (error) {
    return {
      error: NextResponse.json(
        { error: error instanceof Error ? error.message : "Unauthorized" },
        { status: 401 }
      )
    };
  }
}

export function requireRole(user: SessionUser, roles: RoleCode[]): NextResponse | null {
  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden: role not allowed" }, { status: 403 });
  }
  return null;
}
