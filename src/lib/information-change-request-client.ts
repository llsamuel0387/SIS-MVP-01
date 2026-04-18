import { secureFetchJson } from "@/lib/parse-fetch-response-json";
import type { RequestedAddress } from "@/lib/information-change-request";

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
  return secureFetchJson<{ ok: boolean; request: { id: string; status: string; createdAt: string } }>(
    "/api/information-change-requests",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );
}

export async function listMyInformationChangeRequests() {
  return secureFetchJson<StudentInformationChangeRequestRow[]>("/api/information-change-requests");
}

export async function listAdminInformationChangeRequests() {
  return secureFetchJson<InformationChangeRequestRow[]>("/api/admin/information-change-requests");
}

export async function reviewInformationChangeRequest(
  requestId: string,
  decision: "APPROVE" | "REJECT",
  reviewerNote?: string
) {
  return secureFetchJson<{ ok: boolean; status: string }>(`/api/admin/information-change-requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, reviewerNote })
  });
}
