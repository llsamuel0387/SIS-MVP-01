export type PortalEntityType = "STUDENT" | "STAFF";

export type PortalAddressInfo = {
  country: string;
  addressLine1: string;
  addressLine2: string;
  postCode: string;
};

export type PortalProfileInfo = {
  firstNameKo?: string;
  lastNameKo?: string;
  firstNameEn?: string;
  middleNameEn?: string;
  lastNameEn?: string;
  nationality?: string;
  dateOfBirth?: string;
  email?: string;
  department?: string;
  pathway?: string;
  termTimeAddress?: PortalAddressInfo;
  homeAddress?: PortalAddressInfo;
};

export type PortalEntityDetail = {
  id: string;
  entityType: PortalEntityType;
  name: string;
  numberLabel: string;
  numberValue: string;
  roleLabel: string;
  status: string;
  photoDataUrl?: string | null;
  profile?: PortalProfileInfo;
};
