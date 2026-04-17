import type { IdentityProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toPublicProviderConfig } from "@/lib/sso";

export type PatchAdminSsoProviderConfigBody = {
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

export async function patchAdminSsoProviderConfig(provider: IdentityProvider, body: PatchAdminSsoProviderConfigBody) {
  const updated = await prisma.identityProviderConfig.upsert({
    where: { provider },
    update: {
      enabled: body.enabled,
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      issuerUrl: body.issuerUrl,
      authorizationUrl: body.authorizationUrl,
      tokenUrl: body.tokenUrl,
      userInfoUrl: body.userInfoUrl,
      redirectUri: body.redirectUri,
      scope: body.scope
    },
    create: {
      provider,
      enabled: body.enabled ?? false,
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      issuerUrl: body.issuerUrl,
      authorizationUrl: body.authorizationUrl,
      tokenUrl: body.tokenUrl,
      userInfoUrl: body.userInfoUrl,
      redirectUri: body.redirectUri,
      scope: body.scope ?? "openid profile email"
    }
  });

  return { publicConfig: toPublicProviderConfig(updated), enabled: updated.enabled };
}
