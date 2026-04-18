"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import { createEmptyPaginatedResponse } from "@/lib/pagination";
import type { StaffEntityDetail, StaffMe, StaffMemberListPage, StaffMemberRow } from "@/app/(portals)/staffportal/_types/staff-portal";
import {
  getStaffMe,
  getStaffMemberDetail,
  getStaffMembers,
  STAFF_DIRECTORY_PAGE_SIZE
} from "@/app/(portals)/staffportal/_lib/staff-portal-client";
import { canViewStaffByPermissions } from "@/app/(portals)/staffportal/_lib/staff-portal-permissions";
import { toStaffEntityDetail } from "@/app/(portals)/staffportal/_lib/staff-portal-mappers";

export function useStaffMembersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [me, setMe] = useState<StaffMe | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPage, setRowsPage] = useState<StaffMemberListPage>(createEmptyPaginatedResponse(STAFF_DIRECTORY_PAGE_SIZE));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [detail, setDetail] = useState<StaffEntityDetail | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const canViewStaff = useMemo(() => {
    return canViewStaffByPermissions(me?.permissions ?? []);
  }, [me]);

  const reload = useCallback(async () => {
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
      setRowsPage(createEmptyPaginatedResponse(STAFF_DIRECTORY_PAGE_SIZE));
      setLoading(false);
      return;
    }

    const rowsResult = await getStaffMembers(page, STAFF_DIRECTORY_PAGE_SIZE);
    if (!rowsResult.ok) {
      setError(getUiErrorMessage(rowsResult.data, "Failed to load staff list"));
      setRowsPage(createEmptyPaginatedResponse(STAFF_DIRECTORY_PAGE_SIZE));
    } else {
      setRowsPage(rowsResult.data as StaffMemberListPage);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    void reload();
  }, [reload]);

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
    rows: rowsPage.rows,
    page: rowsPage.page,
    total: rowsPage.total,
    totalPages: rowsPage.totalPages,
    hasNextPage: rowsPage.hasNextPage,
    hasPreviousPage: rowsPage.hasPreviousPage,
    goToNextPage: () => setPage((current) => current + 1),
    goToPreviousPage: () => setPage((current) => Math.max(1, current - 1)),
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
