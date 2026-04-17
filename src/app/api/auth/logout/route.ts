import { NextResponse } from "next/server";
import { writeAuditLogForRequest } from "@/lib/audit";
import { getActiveSessionByToken, getSessionCookieName, invalidateSessionByToken } from "@/lib/session";
import { parseCookies } from "@/lib/http";

export async function POST(request: Request) {
  const cookies = parseCookies(request);
  const sessionToken = cookies[getSessionCookieName()];
  if (sessionToken) {
    const sessionRow = await getActiveSessionByToken(sessionToken);
    await invalidateSessionByToken(sessionToken);
    if (sessionRow) {
      await writeAuditLogForRequest(request, {
        actorUserId: sessionRow.userId,
        action: "session_logout",
        targetType: "SESSION",
        targetId: sessionRow.id,
        detail: {}
      });
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.SECURE_COOKIES === "true",
    sameSite: "lax",
    expires: new Date(0),
    path: "/"
  });
  response.cookies.set("csrf_token", "", {
    httpOnly: false,
    secure: process.env.SECURE_COOKIES === "true",
    sameSite: "strict",
    expires: new Date(0),
    path: "/"
  });
  return response;
}
