import { secureFetchJson } from "@/lib/parse-fetch-response-json";

export type SsoProvider = "MICROSOFT" | "ONELOGIN";

export type SsoProviderRow = {
  provider: SsoProvider;
  enabled: boolean;
  clientId: string;
  issuerUrl: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
  scope: string;
  hasClientSecret: boolean;
};

export async function listSsoProviders(): Promise<{ ok: boolean; data: SsoProviderRow[] }> {
  return await secureFetchJson<SsoProviderRow[]>("/api/admin/sso-providers");
}

export async function saveSsoProvider(
  provider: SsoProviderRow,
  secret: string
): Promise<{ ok: boolean; data: unknown }> {
  return await secureFetchJson(`/api/admin/sso-providers/${provider.provider}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      enabled: provider.enabled,
      clientId: provider.clientId || undefined,
      clientSecret: secret || undefined,
      issuerUrl: provider.issuerUrl || undefined,
      authorizationUrl: provider.authorizationUrl || undefined,
      tokenUrl: provider.tokenUrl || undefined,
      userInfoUrl: provider.userInfoUrl || undefined,
      redirectUri: provider.redirectUri || undefined,
      scope: provider.scope || undefined
    })
  });
}
