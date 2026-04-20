"use client";

import AdminPageShell from "@/app/admin/_components/admin-page-shell";
import { useAuditLogs } from "@/app/admin/audit/_hooks/use-audit-logs";
import AuditLogTable from "@/app/admin/audit/_components/audit-log-table";
import LoginIdSearchInput from "@/app/admin/audit/_components/login-id-search-input";
import { AUDIT_ACTIONS, AUDIT_ACTION_LABELS, type AuditAction } from "@/lib/audit-client";

const SECURITY_ACTIONS: AuditAction[] = [
  "rate_limit_breach",
  "login_failure",
  "account_auto_locked_failed_logins",
  "account_delete",
  "account_deactivate"
];

function serverDateStr(offsetDays: number, timezone: string): string {
  const d = new Date(Date.now() - offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function makeDatePresets(timezone: string) {
  return [
    { label: "Today", value: () => serverDateStr(0, timezone) },
    { label: "Yesterday", value: () => serverDateStr(1, timezone) },
    { label: "2 days ago", value: () => serverDateStr(2, timezone) }
  ];
}

export default function AuditLogPageClient() {
  const {
    loading,
    error,
    rows,
    page,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    action,
    date,
    loginId,
    serverTimezone,
    setPage,
    setAction,
    setDate,
    setLoginId
  } = useAuditLogs();

  const DATE_PRESETS = makeDatePresets(serverTimezone);

  const securityEventCount = rows.filter((r) => SECURITY_ACTIONS.includes(r.action)).length;

  return (
    <AdminPageShell
      heroBadge="Admin / Audit"
      heroTitle="Audit Log"
      heroDescription="Security events, authentication activity, and administrative actions."
    >
      {error ? <p className="notice notice-error">{error}</p> : null}

      <section className="grid cols-3">
        <section className="metric stack-sm">
          <span className="eyebrow">Showing</span>
          <strong>{total.toLocaleString()} entries</strong>
        </section>
        <section className="metric stack-sm">
          <span className="eyebrow">Security Events (this page)</span>
          <strong style={{ color: securityEventCount > 0 ? "var(--color-danger, #991b1b)" : undefined }}>
            {securityEventCount}
          </strong>
        </section>
        <section className="metric stack-sm">
          <span className="eyebrow">Page</span>
          <strong>
            {page} / {totalPages}
          </strong>
        </section>
      </section>

      {/* Login ID filter */}
      <section className="stack-sm" style={{ marginBlock: "1rem" }}>
        <span className="eyebrow">Filter by ID</span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <LoginIdSearchInput value={loginId} onSelect={setLoginId} />
          {loginId && (
            <button
              type="button"
              className="button secondary"
              style={{ padding: "4px 12px", fontSize: "0.8rem" }}
              onClick={() => setLoginId("")}
            >
              ✕ Clear
            </button>
          )}
          {loginId && <span className="muted" style={{ fontSize: "0.8rem" }}>Showing logs for: <strong>{loginId}</strong></span>}
        </div>
      </section>

      {/* Date filter */}
      <section className="stack-sm" style={{ marginBlock: "1rem" }}>
        <span className="eyebrow">Filter by date</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            className={date === "" ? "button" : "button secondary"}
            style={{ padding: "4px 12px", fontSize: "0.8rem" }}
            onClick={() => setDate("")}
          >
            All
          </button>
          {DATE_PRESETS.map((preset) => {
            const val = preset.value();
            return (
              <button
                key={preset.label}
                type="button"
                className={date === val ? "button" : "button secondary"}
                style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                onClick={() => setDate(val)}
              >
                {preset.label}
              </button>
            );
          })}
          <input
            type="date"
            value={date}
            max={serverDateStr(0, serverTimezone)}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: "4px 8px", fontSize: "0.8rem", borderRadius: "4px", border: "1px solid var(--color-border, #d1d5db)" }}
          />
          {date && (
            <button
              type="button"
              className="button secondary"
              style={{ padding: "4px 12px", fontSize: "0.8rem" }}
              onClick={() => setDate("")}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </section>

      {/* Action filter */}
      <section className="stack-sm" style={{ marginBlock: "1rem" }}>
        <span className="eyebrow">Filter by action</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button
            type="button"
            className={action === "" ? "button" : "button secondary"}
            style={{ padding: "4px 12px", fontSize: "0.8rem" }}
            onClick={() => setAction("")}
          >
            All
          </button>
          {AUDIT_ACTIONS.map((a) => (
            <button
              key={a}
              type="button"
              className={action === a ? "button" : "button secondary"}
              style={{ padding: "4px 12px", fontSize: "0.8rem" }}
              onClick={() => setAction(a)}
            >
              {AUDIT_ACTION_LABELS[a]}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <p className="notice notice-info">Loading...</p>
      ) : (
        <section className="panel" style={{ padding: 0 }}>
          <AuditLogTable rows={rows} timezone={serverTimezone} />
        </section>
      )}

      {!loading && totalPages > 1 ? (
        <div className="inline-actions" style={{ marginTop: "1rem", justifyContent: "center" }}>
          <button
            type="button"
            className="button secondary"
            disabled={!hasPreviousPage}
            onClick={() => setPage(page - 1)}
          >
            ← Prev
          </button>
          <span className="muted" style={{ padding: "0 0.75rem", lineHeight: "2rem" }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="button secondary"
            disabled={!hasNextPage}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
