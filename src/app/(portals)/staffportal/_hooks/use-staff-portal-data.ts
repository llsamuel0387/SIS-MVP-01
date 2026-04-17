"use client";

import { useEffect, useState } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import type {
  StaffEntityDetail,
  StaffMe,
} from "@/app/(portals)/staffportal/_types/staff-portal";
import { getStaffMe, getStaffMemberDetail } from "@/app/(portals)/staffportal/_lib/staff-portal-client";
import { toStaffEntityDetail } from "@/app/(portals)/staffportal/_lib/staff-portal-mappers";

export function useStaffPortalData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [myInformation, setMyInformation] = useState<StaffEntityDetail | null>(null);
  const [myInformationError, setMyInformationError] = useState("");
  const [myInformationLoading, setMyInformationLoading] = useState(false);

  async function reload() {
    setLoading(true);
    setError("");
    setMessage("");
    setMyInformationError("");
    setMyInformationLoading(true);

    const meResult = await getStaffMe();
    if (!meResult.ok) {
      setError(getUiErrorMessage(meResult.data, "Failed to load current account"));
      setMyInformation(null);
      setMyInformationLoading(false);
      setLoading(false);
      return;
    }
    const meData = meResult.data as StaffMe;

    if (!meData.staffId) {
      setMyInformation(null);
      setMyInformationError("Staff profile is not linked to this account.");
      setMyInformationLoading(false);
    } else {
      const myInformationResult = await getStaffMemberDetail(meData.staffId);
      if (!myInformationResult.ok) {
        setMyInformation(null);
        setMyInformationError(getUiErrorMessage(myInformationResult.data, "Failed to load my profile"));
      } else {
        setMyInformation(toStaffEntityDetail(myInformationResult.data));
      }
      setMyInformationLoading(false);
    }

    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  return {
    loading,
    error,
    message,
    myInformation,
    myInformationError,
    myInformationLoading
  };
}
