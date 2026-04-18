import { getClientIp } from "@/lib/security";
import { loginSchema } from "@/lib/validation";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { runLoginFlow } from "@/lib/auth/login-flow.service";
import { finalizeLoginPostResponse } from "@/lib/auth/login-route.helpers";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    let payload: { loginId: string; password: string };
    try {
      payload = loginSchema.parse(await request.json());
    } catch {
      return errorResponse(ERROR_CODES.AUTH_INVALID_PAYLOAD);
    }

    const flow = await runLoginFlow({
      ip,
      loginId: payload.loginId,
      password: payload.password,
      userAgent: request.headers.get("user-agent") ?? undefined
    });

    return await finalizeLoginPostResponse(request, flow, payload.loginId);
  } catch (error) {
    console.error("[auth/login]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
