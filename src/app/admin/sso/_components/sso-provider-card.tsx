"use client";

import { SplitRow } from "@/ui/page-modules";
import type { SsoProvider, SsoProviderRow } from "@/lib/admin-sso-client";

type SsoProviderCardProps = {
  row: SsoProviderRow;
  secretDraft: string;
  pending: boolean;
  onSecretChange: (provider: SsoProvider, value: string) => void;
  onChange: (provider: SsoProvider, key: keyof SsoProviderRow, value: string | boolean) => void;
  onSave: (row: SsoProviderRow) => void;
};

export default function SsoProviderCard({
  row,
  secretDraft,
  pending,
  onSecretChange,
  onChange,
  onSave
}: SsoProviderCardProps) {
  return (
    <section className="panel stack" key={row.provider}>
      <SplitRow>
        <strong>{row.provider}</strong>
        <label className="inline-actions">
          <input type="checkbox" checked={row.enabled} onChange={(event) => onChange(row.provider, "enabled", event.target.checked)} />
          Enabled
        </label>
      </SplitRow>

      <label className="stack">
        <span className="eyebrow">Client ID</span>
        <input value={row.clientId} onChange={(event) => onChange(row.provider, "clientId", event.target.value)} />
      </label>
      <label className="stack">
        <span className="eyebrow">Client Secret (updates when submitted)</span>
        <input
          type="password"
          value={secretDraft}
          onChange={(event) => onSecretChange(row.provider, event.target.value)}
          autoComplete="new-password"
        />
      </label>
      <label className="stack">
        <span className="eyebrow">Issuer URL</span>
        <input value={row.issuerUrl} onChange={(event) => onChange(row.provider, "issuerUrl", event.target.value)} />
      </label>
      <label className="stack">
        <span className="eyebrow">Authorization URL</span>
        <input value={row.authorizationUrl} onChange={(event) => onChange(row.provider, "authorizationUrl", event.target.value)} />
      </label>
      <label className="stack">
        <span className="eyebrow">Token URL</span>
        <input value={row.tokenUrl} onChange={(event) => onChange(row.provider, "tokenUrl", event.target.value)} />
      </label>
      <label className="stack">
        <span className="eyebrow">UserInfo URL</span>
        <input value={row.userInfoUrl} onChange={(event) => onChange(row.provider, "userInfoUrl", event.target.value)} />
      </label>
      <label className="stack">
        <span className="eyebrow">Redirect URI</span>
        <input value={row.redirectUri} onChange={(event) => onChange(row.provider, "redirectUri", event.target.value)} />
      </label>
      <label className="stack">
        <span className="eyebrow">Scope</span>
        <input value={row.scope} onChange={(event) => onChange(row.provider, "scope", event.target.value)} />
      </label>

      <p className="muted">Client Secret is never returned by API responses (configured: {row.hasClientSecret ? "YES" : "NO"}).</p>

      <button className="button" type="button" onClick={() => onSave(row)} disabled={pending}>
        {pending ? "Saving..." : "Save Provider"}
      </button>
    </section>
  );
}
