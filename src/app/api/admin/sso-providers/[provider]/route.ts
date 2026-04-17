import type { IdentityProvider } from "@prisma/client";
import { NextResponse } from "next/server";
import { writeAuditLogForRequest } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { ssoProviderConfigSchema } from "@/lib/validation";
import { isSsoProvider } from "@/lib/sso";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { guardApiRequest } from "@/lib/api-guard";
import { patchAdminSsoProviderConfig } from "@/lib/sso/patch-admin-sso-provider-config.service";

type Params = { params: Promise<{ provider: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { user: actor, response } = await guardApiRequest(request, {
    permissions: [PERMISSIONS.permissionManage]
  });
  if (response || !actor) {
    return response;
  }

  const { provider } = await params;
  if (!isSsoProvider(provider)) {
    return errorResponse(ERROR_CODES.SSO_PROVIDER_INVALID);
  }

  let body: {
    enabled?: boolean;
    clientId?: string;
    clientSecret?: string;
    issuerUrl?: string;
    authorizationUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    redirectUri?: string;
    scope?: string;
  };
  try {
    body = ssoProviderConfigSchema.parse(await request.json());
  } catch {
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
  }

  const { publicConfig, enabled } = await patchAdminSsoProviderConfig(provider as IdentityProvider, body);

  await writeAuditLogForRequest(request, {
    actorUserId: actor.id,
    action: "sso_provider_update",
    targetType: "SSO_PROVIDER",
    targetId: provider,
    detail: { enabled }
  });

  return NextResponse.json(publicConfig);
}
