import type { IdentityProviderConfig } from "@prisma/client";

export const SSO_PROVIDERS = ["MICROSOFT", "ONELOGIN"] as const;
export type SsoProvider = (typeof SSO_PROVIDERS)[number];

export function isSsoProvider(value: string): value is SsoProvider {
  return SSO_PROVIDERS.includes(value as SsoProvider);
}

export function toPublicProviderConfig(config: IdentityProviderConfig) {
  return {
    provider: config.provider,
    enabled: config.enabled,
    clientId: config.clientId ?? "",
    issuerUrl: config.issuerUrl ?? "",
    authorizationUrl: config.authorizationUrl ?? "",
    tokenUrl: config.tokenUrl ?? "",
    userInfoUrl: config.userInfoUrl ?? "",
    redirectUri: config.redirectUri ?? "",
    scope: config.scope ?? "openid profile email",
    hasClientSecret: Boolean(config.clientSecret),
    updatedAt: config.updatedAt
  };
}

export function buildSsoAuthorizationUrl(input: {
  provider: SsoProvider;
  config: IdentityProviderConfig;
  state: string;
  nonce: string;
}) {
  const authorizationBase =
    input.config.authorizationUrl ||
    (input.provider === "MICROSOFT"
      ? "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
      : undefined);

  if (!authorizationBase || !input.config.clientId || !input.config.redirectUri) {
    return null;
  }

  const url = new URL(authorizationBase);
  url.searchParams.set("client_id", input.config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", input.config.redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", input.config.scope || "openid profile email");
  url.searchParams.set("state", input.state);
  url.searchParams.set("nonce", input.nonce);
  return url.toString();
}
