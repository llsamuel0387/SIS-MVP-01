"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAuditLogs, type AuditAction, type AuditLogPage } from "@/lib/audit-client";
import { getUiErrorMessage } from "@/lib/client-error";

export const PAGE_SIZE = 50;

export function useAuditLogs() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const action = (searchParams.get("action") ?? "") as AuditAction | "";
  const date = searchParams.get("date") ?? "";
  const loginId = searchParams.get("loginId") ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<AuditLogPage | null>(null);

  function serverDayUtcRange(dateStr: string, tz: string): { dateFrom: string; dateTo: string } | undefined {
    if (!dateStr || !tz) return undefined;
    const [year, month, day] = dateStr.split("-").map(Number);
    // Use noon UTC as reference to safely get the timezone offset without DST edge cases
    const ref = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(ref);
    const get = (type: string) => Number(parts.find(p => p.type === type)!.value);
    const tzRefMs = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
    const offsetMs = tzRefMs - ref.getTime();
    const from = new Date(Date.UTC(year, month - 1, day) - offsetMs);
    const to = new Date(Date.UTC(year, month - 1, day + 1) - offsetMs);
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const tz = data?.serverTimezone ?? "";
    const range = serverDayUtcRange(date, tz);
    const { ok, data: result } = await fetchAuditLogs({ page, pageSize: PAGE_SIZE, action, loginId: loginId || undefined, ...range });
    if (!ok) {
      setError(getUiErrorMessage(result, "Failed to load audit logs"));
      setLoading(false);
      return;
    }
    setData(result);
    setLoading(false);
  }, [page, action, date, loginId]);

  useEffect(() => {
    void load();
  }, [load]);

  function navigate(params: { page?: number; action?: AuditAction | ""; date?: string; loginId?: string }) {
    const next = new URLSearchParams(searchParams.toString());
    if (params.page !== undefined) next.set("page", String(params.page));
    if (params.action !== undefined) {
      if (params.action) next.set("action", params.action);
      else next.delete("action");
    }
    if (params.date !== undefined) {
      if (params.date) next.set("date", params.date);
      else next.delete("date");
    }
    if (params.loginId !== undefined) {
      if (params.loginId) next.set("loginId", params.loginId);
      else next.delete("loginId");
    }
    router.push(`?${next.toString()}`);
  }

  return {
    loading,
    error,
    rows: data?.rows ?? [],
    page: data?.page ?? page,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    hasNextPage: data?.hasNextPage ?? false,
    hasPreviousPage: data?.hasPreviousPage ?? false,
    action,
    date,
    loginId,
    serverTimezone: data?.serverTimezone ?? "UTC",
    setPage: (p: number) => navigate({ page: p }),
    setAction: (a: AuditAction | "") => navigate({ page: 1, action: a }),
    setDate: (d: string) => navigate({ page: 1, date: d }),
    setLoginId: (id: string) => navigate({ page: 1, loginId: id })
  };
}
