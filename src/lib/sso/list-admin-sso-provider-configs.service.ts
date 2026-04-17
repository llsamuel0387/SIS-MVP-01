import { prisma } from "@/lib/prisma";
import { SSO_PROVIDERS, toPublicProviderConfig } from "@/lib/sso";

export async function listAdminSsoProviderConfigsForApi() {
  const rows = await prisma.identityProviderConfig.findMany();
  const byProvider = new Map(rows.map((row) => [row.provider, row]));

  return SSO_PROVIDERS.map((provider) => {
    const row = byProvider.get(provider);
    if (!row) {
      return {
        provider,
        enabled: false,
        clientId: "",
        issuerUrl: "",
        authorizationUrl: "",
        tokenUrl: "",
        userInfoUrl: "",
        redirectUri: "",
        scope: "openid profile email",
        hasClientSecret: false,
        updatedAt: null
      };
    }
    return toPublicProviderConfig(row);
  });
}
