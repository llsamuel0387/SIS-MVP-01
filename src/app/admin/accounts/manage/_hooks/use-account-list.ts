"use client";

import { useCallback, useEffect, useState } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import {
  ACCOUNT_LIST_PAGE_SIZE,
  listAccounts,
  type AccountRoleFilter,
  type AccountRow
} from "@/lib/admin-accounts-client";
import { createEmptyPaginatedResponse } from "@/lib/pagination";

export function useAccountList(roleFilter: AccountRoleFilter, appliedSearch: string) {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    const { ok, data } = await listAccounts(roleFilter, appliedSearch || undefined, {
      page,
      pageSize: ACCOUNT_LIST_PAGE_SIZE
    });
    if (!ok) {
      const empty = createEmptyPaginatedResponse<AccountRow>(ACCOUNT_LIST_PAGE_SIZE);
      setRows([]);
      setTotal(empty.total);
      setTotalPages(empty.totalPages);
      setHasNextPage(empty.hasNextPage);
      setHasPreviousPage(empty.hasPreviousPage);
      setError(getUiErrorMessage(data, "Failed to load account list"));
      return;
    }
    setRows(data.rows);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setHasNextPage(data.hasNextPage);
    setHasPreviousPage(data.hasPreviousPage);
    if (data.page !== page) {
      setPage(data.page);
    }
  }, [appliedSearch, page, roleFilter]);

  useEffect(() => {
    setPage(1);
  }, [appliedSearch, roleFilter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    rows,
    page,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToNextPage: () => setPage((current) => current + 1),
    goToPreviousPage: () => setPage((current) => Math.max(1, current - 1)),
    error,
    setError,
    reload
  };
}
