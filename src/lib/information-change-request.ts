import type { InformationChangeRequestStatus } from "@prisma/client";
import { decryptNullableSensitiveField, encryptNullableSensitiveField } from "@/lib/pii-field";

export type RequestedAddress = {
  country: string;
  addressLine1: string;
  addressLine2: string;
  postCode: string;
};

export type RequestedAddressDraft = {
  country?: string;
  addressLine1?: string;
  addressLine2?: string;
  postCode?: string;
};

export type InformationChangeDraft = {
  email?: string;
  termTimeAddress?: RequestedAddressDraft;
  homeAddress?: RequestedAddressDraft;
  requesterNote?: string;
};

export function hasInformationChangeContent(draft: InformationChangeDraft): boolean {
  return Boolean(
    draft.email ||
      draft.requesterNote ||
      draft.termTimeAddress?.country ||
      draft.termTimeAddress?.addressLine1 ||
      draft.termTimeAddress?.addressLine2 ||
      draft.termTimeAddress?.postCode ||
      draft.homeAddress?.country ||
      draft.homeAddress?.addressLine1 ||
      draft.homeAddress?.addressLine2 ||
      draft.homeAddress?.postCode
  );
}

export function normalizeInformationChangeDraft(draft: InformationChangeDraft): InformationChangeDraft {
  return {
    email: draft.email?.trim() || undefined,
    requesterNote: draft.requesterNote?.trim() || undefined,
    termTimeAddress: draft.termTimeAddress
      ? {
          country: draft.termTimeAddress.country?.trim() || undefined,
          addressLine1: draft.termTimeAddress.addressLine1?.trim() || undefined,
          addressLine2: draft.termTimeAddress.addressLine2?.trim() || undefined,
          postCode: draft.termTimeAddress.postCode?.trim() || undefined
        }
      : undefined,
    homeAddress: draft.homeAddress
      ? {
          country: draft.homeAddress.country?.trim() || undefined,
          addressLine1: draft.homeAddress.addressLine1?.trim() || undefined,
          addressLine2: draft.homeAddress.addressLine2?.trim() || undefined,
          postCode: draft.homeAddress.postCode?.trim() || undefined
        }
      : undefined
  };
}

export function getInformationRequestStatusLabel(status: InformationChangeRequestStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

type InformationChangeRequestLike = {
  requestedEmail: string | null;
  requestedTermCountry: string | null;
  requestedTermAddressLine1: string | null;
  requestedTermAddressLine2: string | null;
  requestedTermPostCode: string | null;
  requestedHomeCountry: string | null;
  requestedHomeAddressLine1: string | null;
  requestedHomeAddressLine2: string | null;
  requestedHomePostCode: string | null;
  requesterNote: string | null;
  reviewerNote: string | null;
};

export function encryptInformationChangeDraft(draft: InformationChangeDraft): Omit<InformationChangeRequestLike, "reviewerNote"> {
  return {
    requestedEmail: encryptNullableSensitiveField(draft.email),
    requestedTermCountry: encryptNullableSensitiveField(draft.termTimeAddress?.country),
    requestedTermAddressLine1: encryptNullableSensitiveField(draft.termTimeAddress?.addressLine1),
    requestedTermAddressLine2: encryptNullableSensitiveField(draft.termTimeAddress?.addressLine2),
    requestedTermPostCode: encryptNullableSensitiveField(draft.termTimeAddress?.postCode),
    requestedHomeCountry: encryptNullableSensitiveField(draft.homeAddress?.country),
    requestedHomeAddressLine1: encryptNullableSensitiveField(draft.homeAddress?.addressLine1),
    requestedHomeAddressLine2: encryptNullableSensitiveField(draft.homeAddress?.addressLine2),
    requestedHomePostCode: encryptNullableSensitiveField(draft.homeAddress?.postCode),
    requesterNote: encryptNullableSensitiveField(draft.requesterNote)
  };
}

export function decodeInformationChangeRequestedFields(row: Pick<InformationChangeRequestLike, "requestedEmail" | "requestedTermCountry" | "requestedTermAddressLine1" | "requestedTermAddressLine2" | "requestedTermPostCode" | "requestedHomeCountry" | "requestedHomeAddressLine1" | "requestedHomeAddressLine2" | "requestedHomePostCode">): {
  email: string;
  termTimeAddress: RequestedAddress;
  homeAddress: RequestedAddress;
} {
  return {
    email: decryptNullableSensitiveField(row.requestedEmail),
    termTimeAddress: {
      country: decryptNullableSensitiveField(row.requestedTermCountry),
      addressLine1: decryptNullableSensitiveField(row.requestedTermAddressLine1),
      addressLine2: decryptNullableSensitiveField(row.requestedTermAddressLine2),
      postCode: decryptNullableSensitiveField(row.requestedTermPostCode)
    },
    homeAddress: {
      country: decryptNullableSensitiveField(row.requestedHomeCountry),
      addressLine1: decryptNullableSensitiveField(row.requestedHomeAddressLine1),
      addressLine2: decryptNullableSensitiveField(row.requestedHomeAddressLine2),
      postCode: decryptNullableSensitiveField(row.requestedHomePostCode)
    }
  };
}

export function decodeInformationChangeNotes(row: Pick<InformationChangeRequestLike, "requesterNote" | "reviewerNote">): {
  requesterNote: string;
  reviewerNote: string;
} {
  return {
    requesterNote: decryptNullableSensitiveField(row.requesterNote),
    reviewerNote: decryptNullableSensitiveField(row.reviewerNote)
  };
}
