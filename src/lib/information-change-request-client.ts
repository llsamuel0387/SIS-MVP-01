import { secureClientFetch } from "@/lib/browser-security";
import type { RequestedAddress } from "@/lib/information-change-request";

type FetchResult<T> = { ok: boolean; data: T };

async function fetchJson<T>(url: string, init?: RequestInit): Promise<FetchResult<T>> {
  const response = await secureClientFetch(url, init);
  const raw = await response.text();
  let data: T;
  if (!raw) {
    data = {} as T;
  } else {
    try {
      data = JSON.parse(raw) as T;
    } catch {
      data = {
        error: {
          code: "AUTH_INVALID_PAYLOAD",
          message: "Invalid response format."
        }
      } as T;
    }
  }
  return { ok: response.ok, data };
}

export type InformationChangeRequestRow = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requesterUserId: string;
  requesterLoginId: string;
  requesterName: string;
  requesterNote?: string | null;
  reviewerNote?: string | null;
  createdAt: string;
  handledAt?: string | null;
  requested: {
    email: string;
    termTimeAddress: RequestedAddress;
    homeAddress: RequestedAddress;
  };
};

export type StudentInformationChangeRequestRow = Omit<
  InformationChangeRequestRow,
  "requesterUserId" | "requesterLoginId" | "requesterName"
>;

export type InformationChangeRequestPayload = {
  email?: string;
  termTimeAddress?: RequestedAddress;
  homeAddress?: RequestedAddress;
  requesterNote?: string;
};

export async function createInformationChangeRequest(payload: InformationChangeRequestPayload) {
  return fetchJson<{ ok: boolean; request: { id: string; status: string; createdAt: string } }>("/api/information-change-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function listMyInformationChangeRequests() {
  return fetchJson<StudentInformationChangeRequestRow[]>("/api/information-change-requests");
}

export async function listAdminInformationChangeRequests() {
  return fetchJson<InformationChangeRequestRow[]>("/api/admin/information-change-requests");
}

export async function reviewInformationChangeRequest(
  requestId: string,
  decision: "APPROVE" | "REJECT",
  reviewerNote?: string
) {
  return fetchJson<{ ok: boolean; status: string }>(`/api/admin/information-change-requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, reviewerNote })
  });
}
