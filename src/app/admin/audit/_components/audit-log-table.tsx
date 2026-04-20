"use client";

import { Fragment, useState } from "react";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_SEVERITY,
  type AuditLogRow,
  type ActionSeverity
} from "@/lib/audit-client";

const SEVERITY_STYLE: Record<ActionSeverity, React.CSSProperties> = {
  danger: { background: "var(--color-danger-bg, #fee2e2)", color: "var(--color-danger, #991b1b)", border: "1px solid var(--color-danger-border, #fca5a5)" },
  warning: { background: "var(--color-warning-bg, #fef3c7)", color: "var(--color-warning, #92400e)", border: "1px solid var(--color-warning-border, #fcd34d)" },
  success: { background: "var(--color-success-bg, #d1fae5)", color: "var(--color-success, #065f46)", border: "1px solid var(--color-success-border, #6ee7b7)" },
  info: { background: "var(--color-info-bg, #dbeafe)", color: "var(--color-info, #1e40af)", border: "1px solid var(--color-info-border, #93c5fd)" },
  neutral: { background: "var(--color-neutral-bg, #f3f4f6)", color: "var(--color-neutral, #374151)", border: "1px solid var(--color-neutral-border, #d1d5db)" }
};

const BADGE_BASE: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: 600,
  whiteSpace: "nowrap"
};

function ActionBadge({ action }: { action: AuditLogRow["action"] }) {
  const severity = AUDIT_ACTION_SEVERITY[action] ?? "neutral";
  return (
    <span style={{ ...BADGE_BASE, ...SEVERITY_STYLE[severity] }}>
      {AUDIT_ACTION_LABELS[action] ?? action}
    </span>
  );
}

function tzParts(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  }).formatToParts(date);
}

function get(parts: Intl.DateTimeFormatPart[], type: string) {
  return parts.find(p => p.type === type)?.value ?? "";
}

function EventTime({ iso, timezone }: { iso: string; timezone: string }) {
  const utc = new Date(iso);
  const now = new Date();
  const evP = tzParts(utc, timezone);
  const nowP = tzParts(now, timezone);

  const hour = get(evP, "hour") === "24" ? "00" : get(evP, "hour");
  const hhmm = `${hour}:${get(evP, "minute")}`;
  const mmdd = `${get(evP, "month")}.${get(evP, "day")}`;
  const yy = get(evP, "year").slice(2);

  const isToday = get(evP, "year") === get(nowP, "year") && get(evP, "month") === get(nowP, "month") && get(evP, "day") === get(nowP, "day");
  const isThisYear = get(evP, "year") === get(nowP, "year");
  const label = isToday ? hhmm : isThisYear ? `${mmdd} ${hhmm}` : `${yy}.${mmdd} ${hhmm}`;

  const diffMs = Date.now() - utc.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const relative =
    diffSec < 60 ? `${diffSec}s ago` :
    diffMin < 60 ? `${diffMin}m ago` :
    diffHour < 24 ? `${diffHour}h ago` :
    `${diffDay}d ago`;

  return (
    <time
      dateTime={iso}
      title={`${get(evP, "year")}-${get(evP, "month")}-${get(evP, "day")} ${hhmm} (${timezone}) · ${relative}`}
      style={{ whiteSpace: "nowrap", cursor: "default" }}
    >
      {label}
    </time>
  );
}

function DetailPanel({ detail }: { detail: Record<string, unknown> }) {
  return (
    <table style={{ fontSize: "0.8rem", borderCollapse: "collapse", width: "100%" }}>
      <tbody>
        {Object.entries(detail).map(([k, v]) => (
          <tr key={k}>
            <td style={{ padding: "2px 8px 2px 0", fontWeight: 600, verticalAlign: "top", whiteSpace: "nowrap" }}>
              {k}
            </td>
            <td style={{ padding: "2px 0", wordBreak: "break-all" }}>
              {typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type AuditLogTableProps = {
  rows: AuditLogRow[];
  timezone: string;
};

export default function AuditLogTable({ rows, timezone }: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <section className="panel">
        <p className="muted">No audit log entries.</p>
      </section>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
            <th style={TH}>Time</th>
            <th style={TH}>Action</th>
            <th style={TH}>Actor</th>
            <th style={TH}>Target</th>
            <th style={TH}>IP</th>
            <th style={{ ...TH, width: "2.5rem" }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const rowKey = `${row.createdAt}-${i}`;
            const isExpanded = expandedId === rowKey;
            const hasDetail = row.detail && Object.keys(row.detail).length > 0;
            return (
              <Fragment key={rowKey}>
                <tr
                  style={{
                    borderBottom: "1px solid var(--color-border, #e5e7eb)",
                    background: isExpanded ? "var(--color-row-active, #f9fafb)" : undefined
                  }}
                >
                  <td style={TD}>
                    <EventTime iso={row.createdAt} timezone={timezone} />
                  </td>
                  <td style={TD}>
                    <ActionBadge action={row.action} />
                  </td>
                  <td style={{ ...TD, maxWidth: "10rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.actorLoginId ? (
                      <span title={row.actorUserId}>{row.actorLoginId}</span>
                    ) : row.actorUserId ? (
                      <span className="muted">{row.actorUserId}</span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td style={TD}>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      {row.targetType}
                    </span>{" "}
                    {row.targetLoginId ? (
                      <span title={row.targetId}>{row.targetLoginId}</span>
                    ) : (
                      <span className="muted">{row.targetId}</span>
                    )}
                  </td>
                  <td style={{ ...TD, fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {row.ipAddress ?? <span className="muted">—</span>}
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    {hasDetail ? (
                      <button
                        type="button"
                        className="button secondary"
                        style={{ padding: "2px 8px", fontSize: "0.75rem", minWidth: "unset" }}
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedId(isExpanded ? null : rowKey)}
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    ) : null}
                  </td>
                </tr>
                {isExpanded && hasDetail ? (
                  <tr key={`${rowKey}-detail`} style={{ background: "var(--color-row-active, #f9fafb)" }}>
                    <td colSpan={6} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      <DetailPanel detail={row.detail!} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const TH: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  textAlign: "left",
  fontWeight: 600,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--color-text-muted, #6b7280)",
  whiteSpace: "nowrap"
};

const TD: React.CSSProperties = {
  padding: "0.625rem 0.75rem",
  verticalAlign: "middle"
};
