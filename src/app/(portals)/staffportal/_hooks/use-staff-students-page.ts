"use client";

import { useEffect, useMemo, useState } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import type { StaffEntityDetail, StaffMe, StaffStudentRow } from "@/app/(portals)/staffportal/_types/staff-portal";
import { getStaffMe, getStaffStudentDetail, getStaffStudents } from "@/app/(portals)/staffportal/_lib/staff-portal-client";
import { canViewStudentsByPermissions } from "@/app/(portals)/staffportal/_lib/staff-portal-permissions";
import { toStudentEntityDetail } from "@/app/(portals)/staffportal/_lib/staff-portal-mappers";

export function useStaffStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [me, setMe] = useState<StaffMe | null>(null);
  const [rows, setRows] = useState<StaffStudentRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [detail, setDetail] = useState<StaffEntityDetail | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const canViewStudents = useMemo(() => {
    return canViewStudentsByPermissions(me?.permissions ?? []);
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

    const canView = canViewStudentsByPermissions(meData.permissions);
    if (!canView) {
      setRows([]);
      setLoading(false);
      return;
    }

    const rowsResult = await getStaffStudents();
    if (!rowsResult.ok) {
      setError(getUiErrorMessage(rowsResult.data, "Failed to load student list"));
      setRows([]);
    } else {
      setRows(rowsResult.data as StaffStudentRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function openInformation(row: StaffStudentRow) {
    setPendingId(row.id);
    setDialogOpen(true);
    setDialogError("");
    const detailResult = await getStaffStudentDetail(row.id);
    setPendingId(null);

    if (!detailResult.ok) {
      setDialogError(getUiErrorMessage(detailResult.data, "Failed to load student details"));
      setDetail(null);
      return;
    }

    setDetail(toStudentEntityDetail(detailResult.data));
  }

  return {
    loading,
    error,
    canViewStudents,
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
