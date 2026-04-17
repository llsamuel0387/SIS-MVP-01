"use client";

import { useEffect, useState } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import {
  listAdminInformationChangeRequests,
  reviewInformationChangeRequest,
  type InformationChangeRequestRow
} from "@/lib/information-change-request-client";

export function useInformationChangeRequests() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rows, setRows] = useState<InformationChangeRequestRow[]>([]);

  async function reload() {
    setLoading(true);
    setError("");
    const { ok, data } = await listAdminInformationChangeRequests();
    if (!ok) {
      setError(getUiErrorMessage(data, "Failed to load request list"));
      setRows([]);
      setLoading(false);
      return;
    }
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function review(requestId: string, decision: "APPROVE" | "REJECT") {
    setPendingId(requestId);
    setError("");
    setMessage("");
    const { ok, data } = await reviewInformationChangeRequest(requestId, decision);
    setPendingId(null);
    if (!ok) {
      setError(getUiErrorMessage(data, "Failed to process request"));
      return;
    }
    setMessage(decision === "APPROVE" ? "Request approved." : "Request rejected.");
    await reload();
  }

  return {
    loading,
    error,
    message,
    pendingId,
    rows,
    review
  };
}
