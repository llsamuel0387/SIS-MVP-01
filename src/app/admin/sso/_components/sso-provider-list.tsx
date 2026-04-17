import SsoProviderCard from "@/app/admin/sso/_components/sso-provider-card";
import type { SsoProvider, SsoProviderRow } from "@/lib/admin-sso-client";

type SsoProviderListProps = {
  rows: SsoProviderRow[];
  secretDrafts: Record<string, string>;
  pendingProvider: string | null;
  onChange: (provider: SsoProvider, key: keyof SsoProviderRow, value: string | boolean) => void;
  onSecretChange: (provider: SsoProvider, value: string) => void;
  onSave: (row: SsoProviderRow) => void;
};

export default function SsoProviderList({
  rows,
  secretDrafts,
  pendingProvider,
  onChange,
  onSecretChange,
  onSave
}: SsoProviderListProps) {
  return (
    <>
      {rows.map((row) => (
        <SsoProviderCard
          key={row.provider}
          row={row}
          secretDraft={secretDrafts[row.provider] ?? ""}
          pending={pendingProvider === row.provider}
          onChange={onChange}
          onSecretChange={onSecretChange}
          onSave={onSave}
        />
      ))}
    </>
  );
}
