import { decryptPersonSectionPayload } from "@/lib/person-data";

type PersonSectionLike = {
  sectionKey: string;
  cipherText: string;
  nonce: string;
  authTag: string;
};

export type IdentityPayload = {
  firstNameKo: string;
  lastNameKo: string;
  firstNameEn: string;
  middleNameEn: string;
  lastNameEn: string;
  nationality: string;
  dateOfBirth: string;
  email: string;
};

type StudentAddressPayload = {
  termTimeAddress: {
    country: string;
    addressLine1: string;
    addressLine2: string;
    postCode: string;
  };
  homeAddress: {
    country: string;
    addressLine1: string;
    addressLine2: string;
    postCode: string;
  };
};

function readSectionPayload(sections: PersonSectionLike[] | undefined, sectionKey: string): Record<string, unknown> | null {
  const section = sections?.find((item) => item.sectionKey === sectionKey);
  if (!section) {
    return null;
  }
  try {
    return decryptPersonSectionPayload(section);
  } catch {
    return null;
  }
}

function readString(payload: Record<string, unknown> | null, key: string): string {
  const value = payload?.[key];
  return typeof value === "string" ? value : "";
}

export function readIdentityFromPersonSections(sections: PersonSectionLike[] | undefined): IdentityPayload {
  const payload = readSectionPayload(sections, "identity.v1");
  const legacyFirstEn = readString(payload, "firstNameEn") || readString(payload, "surname");
  const legacyMiddle = readString(payload, "middleNameEn") || readString(payload, "middleName");
  const legacyLastEn = readString(payload, "lastNameEn") || readString(payload, "lastName");
  return {
    firstNameKo: readString(payload, "firstNameKo"),
    lastNameKo: readString(payload, "lastNameKo"),
    firstNameEn: legacyFirstEn,
    middleNameEn: legacyMiddle,
    lastNameEn: legacyLastEn,
    nationality: readString(payload, "nationality"),
    dateOfBirth: readString(payload, "dateOfBirth"),
    email: readString(payload, "email")
  };
}

function readAddressObject(payload: Record<string, unknown> | null, key: string) {
  const raw = payload?.[key];
  if (!raw || typeof raw !== "object") {
    return {
      country: "",
      addressLine1: "",
      addressLine2: "",
      postCode: ""
    };
  }
  const address = raw as Record<string, unknown>;
  return {
    country: typeof address.country === "string" ? address.country : "",
    addressLine1: typeof address.addressLine1 === "string" ? address.addressLine1 : "",
    addressLine2: typeof address.addressLine2 === "string" ? address.addressLine2 : "",
    postCode: typeof address.postCode === "string" ? address.postCode : ""
  };
}

export function readStudentAddressFromPersonSections(sections: PersonSectionLike[] | undefined): StudentAddressPayload {
  const payload = readSectionPayload(sections, "student-address.v1");
  return {
    termTimeAddress: readAddressObject(payload, "termTimeAddress"),
    homeAddress: readAddressObject(payload, "homeAddress")
  };
}
