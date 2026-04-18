"use client";

import { useEffect, useState } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import { getStudentMyProfile } from "@/app/(portals)/studentportal/_lib/student-portal-client";
import {
  createInformationChangeRequest,
  listMyInformationChangeRequests,
  type StudentInformationChangeRequestRow
} from "@/lib/information-change-request-client";
import type { RequestedAddress } from "@/lib/information-change-request";

type CurrentInfo = {
  email: string;
  termTimeAddress: RequestedAddress;
  homeAddress: RequestedAddress;
};

type RequestDraft = {
  email: string;
  termTimeAddress: RequestedAddress;
  homeAddress: RequestedAddress;
  requesterNote: string;
};

function createEmptyAddress(): RequestedAddress {
  return {
    country: "",
    addressLine1: "",
    addressLine2: "",
    postCode: ""
  };
}

function createEmptyDraft(): RequestDraft {
  return {
    email: "",
    termTimeAddress: createEmptyAddress(),
    homeAddress: createEmptyAddress(),
    requesterNote: ""
  };
}

function hasAddressValue(address: RequestedAddress): boolean {
  return Boolean(address.country || address.addressLine1 || address.addressLine2 || address.postCode);
}

export function useStudentInformationEdit() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [current, setCurrent] = useState<CurrentInfo | null>(null);
  const [requests, setRequests] = useState<StudentInformationChangeRequestRow[]>([]);
  const [draft, setDraft] = useState<RequestDraft>(createEmptyDraft());

  async function reload() {
    setLoading(true);
    setError("");

    const [profileResult, requestsResult] = await Promise.all([
      getStudentMyProfile(),
      listMyInformationChangeRequests()
    ]);

    if (!profileResult.ok) {
      setError(getUiErrorMessage(profileResult.data, "Failed to load current profile"));
      setLoading(false);
      return;
    }
    if (!profileResult.data.profile) {
      setError("Profile data is incomplete.");
      setLoading(false);
      return;
    }

    setCurrent({
      email: profileResult.data.profile.email ?? "",
      termTimeAddress: profileResult.data.profile.termTimeAddress ?? createEmptyAddress(),
      homeAddress: profileResult.data.profile.homeAddress ?? createEmptyAddress()
    });

    if (!requestsResult.ok) {
      setError(getUiErrorMessage(requestsResult.data, "Failed to load request history"));
      setRequests([]);
    } else {
      setRequests(requestsResult.data);
    }

    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function submitRequest() {
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      email: draft.email.trim() || undefined,
      termTimeAddress: hasAddressValue(draft.termTimeAddress) ? draft.termTimeAddress : undefined,
      homeAddress: hasAddressValue(draft.homeAddress) ? draft.homeAddress : undefined,
      requesterNote: draft.requesterNote.trim() || undefined
    };

    if (!payload.email && !payload.termTimeAddress && !payload.homeAddress && !payload.requesterNote) {
      setSaving(false);
      setError("Enter at least one field to request a change.");
      return;
    }

    const { ok, data } = await createInformationChangeRequest(payload);
    setSaving(false);
    if (!ok) {
      setError(getUiErrorMessage(data, "Failed to submit change request"));
      return;
    }

    setMessage("Information change request has been sent to admin.");
    setDraft(createEmptyDraft());
    await reload();
  }

  return {
    loading,
    saving,
    error,
    message,
    current,
    draft,
    requests,
    setDraft,
    submitRequest
  };
}
