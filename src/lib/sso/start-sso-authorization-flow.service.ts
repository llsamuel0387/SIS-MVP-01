import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ERROR_CODES } from "@/lib/api-error";
import { buildSsoAuthorizationUrl } from "@/lib/sso";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type StartSsoAuthorizationFlowInput = {
  provider: "MICROSOFT" | "ONELOGIN";
};

export async function startSsoAuthorizationFlow(input: StartSsoAuthorizationFlowInput) {
  const config = await prisma.identityProviderConfig.findUnique({
    where: { provider: input.provider }
  });

  if (!config) {
    return { ok: false as const, code: ERROR_CODES.SSO_PROVIDER_NOT_CONFIGURED as ErrorCode };
  }
  if (!config.enabled) {
    return { ok: false as const, code: ERROR_CODES.SSO_PROVIDER_DISABLED as ErrorCode };
  }

  const state = crypto.randomBytes(24).toString("base64url");
  const nonce = crypto.randomBytes(24).toString("base64url");
  const authorizationUrl = buildSsoAuthorizationUrl({
    provider: input.provider,
    config,
    state,
    nonce
  });
  if (!authorizationUrl) {
    return { ok: false as const, code: ERROR_CODES.SSO_PROVIDER_NOT_CONFIGURED as ErrorCode };
  }

  return {
    ok: true as const,
    data: {
      provider: input.provider,
      authorizationUrl,
      state,
      nonce
    }
  };
}
