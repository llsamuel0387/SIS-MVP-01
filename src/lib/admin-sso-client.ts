import { secureClientFetch } from "@/lib/browser-security";

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

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T }> {
  const response = await secureClientFetch(url, init);
  const data = (await response.json()) as T;
  return { ok: response.ok, data };
}

export async function listSsoProviders(): Promise<{ ok: boolean; data: SsoProviderRow[] }> {
  return await fetchJson<SsoProviderRow[]>("/api/admin/sso-providers");
}

export async function saveSsoProvider(
  provider: SsoProviderRow,
  secret: string
): Promise<{ ok: boolean; data: unknown }> {
  return await fetchJson(`/api/admin/sso-providers/${provider.provider}`, {
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
