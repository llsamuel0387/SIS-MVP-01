"use client";

import { useEffect, useMemo, useState } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import type { StaffEntityDetail, StaffMe, StaffMemberRow } from "@/app/(portals)/staffportal/_types/staff-portal";
import { getStaffMe, getStaffMemberDetail, getStaffMembers } from "@/app/(portals)/staffportal/_lib/staff-portal-client";
import { canViewStaffByPermissions } from "@/app/(portals)/staffportal/_lib/staff-portal-permissions";
import { toStaffEntityDetail } from "@/app/(portals)/staffportal/_lib/staff-portal-mappers";

export function useStaffMembersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [me, setMe] = useState<StaffMe | null>(null);
  const [rows, setRows] = useState<StaffMemberRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [detail, setDetail] = useState<StaffEntityDetail | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const canViewStaff = useMemo(() => {
    return canViewStaffByPermissions(me?.permissions ?? []);
  }, [me]);

  async function reload() {
    setLoading(true);
    setError("");

    const meResult = await getStaffMe();
    if (!meResult.ok) {
      setError(getUiErrorMessage(meResult.data, "Failed to load current account"));
      setLoading(false);
      return;
    }
    const meData = meResult.data as StaffMe;
    setMe(meData);

    const canView = canViewStaffByPermissions(meData.permissions);
    if (!canView) {
      setRows([]);
      setLoading(false);
      return;
    }

    const rowsResult = await getStaffMembers();
    if (!rowsResult.ok) {
      setError(getUiErrorMessage(rowsResult.data, "Failed to load staff list"));
      setRows([]);
    } else {
      setRows(rowsResult.data as StaffMemberRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function openInformation(row: StaffMemberRow) {
    setPendingId(row.id);
    setDialogOpen(true);
    setDialogError("");
    const detailResult = await getStaffMemberDetail(row.id);
    setPendingId(null);

    if (!detailResult.ok) {
      setDialogError(getUiErrorMessage(detailResult.data, "Failed to load staff details"));
      setDetail(null);
      return;
    }

    setDetail(toStaffEntityDetail(detailResult.data));
  }

  return {
    loading,
    error,
    canViewStaff,
    rows,
    dialogOpen,
    dialogError,
    detail,
    pendingId,
    openInformation,
    closeInformation: () => {
      setDialogOpen(false);
      setDialogError("");
    }
  };
}
